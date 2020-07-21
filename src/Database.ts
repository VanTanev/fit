import * as PATH from 'path'
import * as IO from 'fp-ts/lib/IO'
import * as IE from 'fp-ts/lib/IOEither'
import { pipe } from 'fp-ts/lib/pipeable'

import { DatabaseObject } from './database/DatabaseObject'
import * as fs from './fsUtils'
import { deflate } from './util'

export class Database {
    constructor(private path: string) {}

    store(o: DatabaseObject): fs.IOEitherNode {
        let objectPath = PATH.join(this.path, o.oid.substring(0, 2), o.oid.substring(2))
        return pipe(
            objectPath,
            fs.fileExists,
            IO.chain((exists) =>
                exists
                    ? IE.right(void 0)
                    : fs.writeFileSyncCrashSafe(objectPath, deflate(o.content)),
            ),
        )
    }
}
