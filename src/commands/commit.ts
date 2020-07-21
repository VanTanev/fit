import * as PATH from 'path'
import * as IE from 'fp-ts/lib/IOEither'
import * as A from 'fp-ts/lib/Array'
import * as AP from 'fp-ts/lib/Apply'
import * as C from 'fp-ts/lib/Console'
import { pipe } from 'fp-ts/lib/pipeable'
import * as fs from '../fsUtils'

import { Workspace } from '../Workspace'
import { Database } from '../Database'
import { Tree, TreeEntry } from '../database/Tree'
import { Commit } from '../database/Commit'
import { Author } from '../database/Author'

export function commit(): IE.IOEither<Error, any> {
    let rootPath = process.cwd()
    let gitPath = PATH.join(rootPath, '.git')
    let dbPath = PATH.join(gitPath, 'objects')

    let workspace = new Workspace(rootPath)
    let database = new Database(dbPath)

    return pipe(
        workspace.listFiles(),
        IE.chain((filesList) => workspace.readFiles(filesList)),
        IE.chain((files) => {
            let entries = files.map((fb) => new TreeEntry(fb.path, fb.blob.oid))
            let tree = new Tree(entries)
            let commit = new Commit(
                undefined,
                tree.oid,
                new Author('Ivan', 'vankata.t@gmail.com'),
                'commit message',
            )
            let storeBlobs = A.array.traverse(IE.ioEither)(files, (f) => database.store(f.blob))

            return AP.sequenceT(IE.ioEither)(
                storeBlobs,
                database.store(tree),
                database.store(commit),
                fs.writeFileSyncCrashSafe(PATH.join(gitPath, 'HEAD'), commit.oid),
                IE.rightIO(C.log(`[(root-commit) ${commit.oid} ${commit.message.split('\n')[0]}]`)),
            )
        }),
    )
}
