import * as PATH from 'path'
import * as FS from 'fs'

import * as TE from 'fp-ts/lib/TaskEither'
import * as A from 'fp-ts/lib/Array'
import * as AP from 'fp-ts/lib/Apply'
import * as M from 'fp-ts/lib/ReadonlyMap'
import * as C from 'fp-ts/lib/Console'
import * as Ord from 'fp-ts/lib/Ord'
import { pipe } from 'fp-ts/lib/pipeable'
import { Do } from 'fp-ts-contrib/lib/Do'

import { Workspace } from '../Workspace'
import { Database } from '../Database'
import { Tree, Entry } from '../database/Tree'
import { Commit } from '../database/Commit'
import { Author } from '../database/Author'
import { Refs } from '../Refs'

let traverseArr = A.array.traverse(TE.taskEither)
let traverseMap = M.getWitherable(Ord.ordString).traverse(TE.taskEither)

export function commit(): TE.TaskEither<Error, any> {
    let rootPath = process.cwd()
    let gitPath = PATH.join(rootPath, '.git')
    let dbPath = PATH.join(gitPath, 'objects')

    let workspace = new Workspace(rootPath)
    let db = new Database(dbPath)
    let refs = new Refs(gitPath)

    let inputs = Do(TE.taskEither)
        .bind('fileList', workspace.listFiles())
        .bindL('files', ({ fileList }) => traverseArr(fileList, workspace.readFile))
        .bindL('parent', () => TE.fromTask(refs.readHead()))
        .bindL('commitMessage', () => TE.rightIO(() => FS.readFileSync(0).toString('utf8')))
        .done()

    return pipe(
        inputs,
        TE.chain(({ files, parent, commitMessage }) => {
            let entries = files.map((f) => new Entry(f.filePath, f.oid, f.stat))
            let tree = Tree.build(entries)
            let commit = new Commit(
                parent,
                tree.oid,
                new Author('Ivan', 'vankata.t@gmail.com'),
                commitMessage,
            )

            let recursivelyStoreTree = (t: Tree): TE.TaskEither<NodeJS.ErrnoException, void> => {
                return pipe(
                    db.store(t),
                    TE.chain(() => traverseMap(t.trees, recursivelyStoreTree)),
                ) as any
            }

            return AP.sequenceT(TE.taskEither)(
                traverseArr(files, db.store),
                db.store(tree),
                recursivelyStoreTree(tree),
                db.store(commit),
                refs.updateHead(commit.oid),
                TE.rightIO(
                    C.log(
                        `[${!parent ? '(root-commit) ' : ''}${commit.oid}] ${
                            commit.message.split('\n')[0]
                        }`,
                    ),
                ),
            )
        }),
    )
}
