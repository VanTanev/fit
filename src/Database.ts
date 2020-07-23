import * as PATH from 'path'
import * as TE from 'fp-ts/lib/TaskEither'
import { pipe } from 'fp-ts/lib/pipeable'

import { DatabaseObject } from './database/DatabaseObject'
import * as fs from './fsUtils'
import { deflate } from './util'

export class Database {
    constructor(private path: string) {}

    store(o: DatabaseObject): fs.TaskEitherNode {
        let objectPath = PATH.join(this.path, o.oid.substring(0, 2), o.oid.substring(2))
        return pipe(
            TE.rightTask(fs.fileExists(objectPath)),
            TE.chain((exists) =>
                exists
                    ? TE.right(void 0)
                    : fs.writeFileCrashSafe(objectPath, deflate(o.content)),
            ),
        )
    }
}
