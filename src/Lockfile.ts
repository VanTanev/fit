import * as FS from 'fs'

import * as TE from 'fp-ts/lib/TaskEither'
import * as O from 'fp-ts/lib/Option'
import * as E from 'fp-ts/lib/Either'
import { pipe } from 'fp-ts/lib/pipeable'

import * as fs from './fs'

export class LockDenied extends Error {}
export class MissingParent extends Error {}
export class NoPermission extends Error {}
export class StaleLock extends Error {}

export class Lockfile {
    constructor(
        private readonly path: string,
        private readonly pathLock: string,
        private lock: O.Option<FS.promises.FileHandle>,
    ) {}

    static create(
        path: string,
    ): TE.TaskEither<NodeJS.ErrnoException | LockDenied | MissingParent | NoPermission, Lockfile> {
        let pathLock = path + '.lock'
        return TE.tryCatch(async () => {
            try {
                let mode = FS.constants.O_RDWR | FS.constants.O_CREAT | FS.constants.O_EXCL
                let lock = await FS.promises.open(pathLock, mode)
                return new Lockfile(path, pathLock, O.some(lock))
            } catch (e: unknown) {
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

    write(data: string | Buffer): fs.TaskEitherNode<Lockfile, NodeJS.ErrnoException | StaleLock> {
        return pipe(
            this.getLock(),
            TE.map((lock) => fs.writeFile(lock, data)),
            TE.map(() => this),
        )
    }

    commit(): fs.TaskEitherNode {
        return pipe(
            this.getLock(),
            TE.map(lock => fs.close(lock)),
            TE.map(() => fs.rename(this.pathLock, this.path)),
            TE.map(() => {
                this.lock = O.none
                return void 0
            }),
        )
    }

    rollback(): fs.TaskEitherNode {
        return pipe(
            this.getLock(),
            TE.map(fs.close),
            TE.map(() => fs.unlink(this.pathLock)),
            TE.map(() => {
                this.lock = O.none
                return void 0
            }),
        )
    }

    private getLock(): fs.TaskEitherNode<FS.promises.FileHandle, StaleLock> {
        return pipe(
            this.lock,
            TE.fromOption(() => new StaleLock(`Not holding a lock on file ${this.pathLock}`)),
        )
    }
}
