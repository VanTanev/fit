import * as FS from 'fs'

import * as TE from 'fp-ts/lib/TaskEither'
import * as E from 'fp-ts/lib/Either'
import { pipe } from 'fp-ts/lib/pipeable'
import * as AP from 'fp-ts/lib/Apply'

import * as fs from './fsUtils'

class LockDenied extends Error {}
class MissingParent extends Error {}
class NoPermission extends Error {}
class StaleLock extends Error {}

export class Lockfile {
    constructor(
        private readonly path: string,
        private readonly pathLock: string,
        private lock?: FS.promises.FileHandle,
    ) {}

    static create(
        path: string,
    ): TE.TaskEither<NodeJS.ErrnoException | LockDenied | MissingParent | NoPermission, Lockfile> {
        let pathLock = path + '.lock'
        return TE.tryCatch(async () => {
            try {
                let flags = FS.constants.O_RDWR | FS.constants.O_CREAT | FS.constants.O_EXCL
                let lock = await FS.promises.open(pathLock, flags)
                return new Lockfile(path, pathLock, lock)
            } catch (e) {
                let err = e as NodeJS.ErrnoException
                switch (err.code) {
                    case 'EEXIST':
                        throw new LockDenied(`Unable to create '${pathLock}': File exists.`)

                    case 'ENOENT':
                        throw new MissingParent(err.message)

                    case 'EACCES':
                        throw new NoPermission(err.message)
                }
                throw e
            }
        }, E.toError)
    }

    write(data: string | Buffer): TE.TaskEither<NodeJS.ErrnoException, Lockfile> {
        this.assertLock(this.lock)
        return pipe(
            fs.writeFile(this.lock, data),
            TE.map(() => this),
        )
    }

    commit(): TE.TaskEither<NodeJS.ErrnoException, void> {
        this.assertLock(this.lock)
        return pipe(
            AP.sequenceT(TE.taskEither)(fs.close(this.lock), fs.rename(this.pathLock, this.path)),
            TE.chain(() => TE.fromIO(() => (this.lock = undefined))),
        )
    }

    rollback(): TE.TaskEither<NodeJS.ErrnoException, void> {
        this.assertLock(this.lock)
        return pipe(
            AP.sequenceT(TE.taskEither)(fs.close(this.lock), fs.unlink(this.pathLock)),
            TE.chain(() => TE.fromIO(() => (this.lock = undefined))),
        )
    }

    private assertLock(lock: unknown): asserts lock is FS.promises.FileHandle {
        if (!lock) {
            throw new StaleLock(`Not holding a lock on file ${this.pathLock}`)
        }
    }
}
