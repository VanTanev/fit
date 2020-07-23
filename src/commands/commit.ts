import * as PATH from 'path'
import * as TE from 'fp-ts/lib/TaskEither'
import * as A from 'fp-ts/lib/Array'
import * as AP from 'fp-ts/lib/Apply'
import * as C from 'fp-ts/lib/Console'
import { pipe } from 'fp-ts/lib/pipeable'
import * as fs from '../fsUtils'
import * as FS from 'fs'
import { Do } from 'fp-ts-contrib/lib/Do'

import { Workspace } from '../Workspace'
import { Database } from '../Database'
import { Tree, TreeEntry } from '../database/Tree'
import { Commit } from '../database/Commit'
import { Author } from '../database/Author'
import { Refs } from '../Refs'

export function commit(): TE.TaskEither<Error, any> {
    let rootPath = process.cwd()
    let gitPath = PATH.join(rootPath, '.git')
    let dbPath = PATH.join(gitPath, 'objects')

    let workspace = new Workspace(rootPath)
    let database = new Database(dbPath)
    let refs = new Refs(gitPath)

    let inputs = Do(TE.taskEither)
        .bind('files', workspace.readFilesInWorkspace())
        .bindL('parent', () => TE.fromTask(refs.readHead()))
        .bindL('commitMessage', () => TE.rightIO(() => FS.readFileSync(0).toString('utf8')))
        .done()

    return pipe(
        inputs,
        TE.chain(({ files, parent, commitMessage }) => {
            let entries = files.map((fb) => new TreeEntry(fb.path, fb.blob.oid))
            let tree = new Tree(entries)
            let commit = new Commit(
                parent,
                tree.oid,
                new Author('Ivan', 'vankata.t@gmail.com'),
                commitMessage,
            )

            return AP.sequenceT(TE.taskEither)(
                A.array.traverse(TE.taskEither)(files, (f) => database.store(f.blob)),
                database.store(tree),
                database.store(commit),
                fs.writeFileCrashSafe(PATH.join(gitPath, 'HEAD'), commit.oid),
                TE.rightIO(C.log(`[${!parent ? '(root-commit) ' : ''}${commit.oid}] ${commit.message.split('\n')[0]}`)),
            )
        }),
    )
}
