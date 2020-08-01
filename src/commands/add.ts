import * as PATH from 'path'

import * as TE from 'fp-ts/lib/TaskEither'
import * as AP from 'fp-ts/lib/Apply'
import { pipe } from 'fp-ts/lib/pipeable'

import { Workspace } from '../Workspace'
import { Database } from '../Database'
import { Index } from '../Index'

export function add(...paths: string[]): TE.TaskEither<Error, any> {
    let rootPath = process.cwd()
    let gitPath = PATH.join(rootPath, '.git')
    let dbPath = PATH.join(gitPath, 'objects')
    let indexPath = PATH.join(gitPath, 'index')

    let workspace = new Workspace(rootPath)
    let db = new Database(dbPath)
    let index = new Index(indexPath)

    let path = paths[0]
    return pipe(
        workspace.readFile(path),
        TE.chain((file) => {
            index = index.add(file)
            return AP.sequenceT(TE.taskEither)(db.store(file), index.writeUpdates())
        }),
    )
    // let file = workspace.readFile(path)
    // db.store(blocking

    // return pipe(TE.right(0))
}
