import * as PATH from 'path'
import * as TE from 'fp-ts/lib/TaskEither'
import * as T from 'fp-ts/lib/Task'
import { pipe } from 'fp-ts/lib/pipeable'

import * as fs from './fsUtils'
import { Lockfile } from './Lockfile'

export class Refs {
    constructor(readonly path: string) {}

    updateHead(oid: string): fs.TaskEitherNode {
        return pipe(
            Lockfile.create(this.pathHead()),
            TE.chain((lock) => lock.write(oid)),
            TE.chain((lock) => lock.write('\n')),
            TE.chain((lock) => lock.commit()),
        )
    }

    readHead(): T.Task<string | undefined> {
        return pipe(
            fs.readFile(this.pathHead()),
            TE.map((buf) => buf.toString().trim()),
            TE.getOrElseW(() => T.of(void 0)),
        )
    }

    private pathHead(): string {
        return PATH.join(this.path, 'HEAD')
    }
}
