import * as PATH from 'path'

import { pipe } from 'fp-ts/lib/pipeable'
import * as TE from 'fp-ts/lib/TaskEither'
import * as A from 'fp-ts/lib/Array'
import { Do } from 'fp-ts-contrib/lib/Do'

import * as fs from './fsUtils'
import { FileBlob } from './database/Blob'

const traverseArr = A.array.traverse(TE.taskEither)

export class Workspace {
    static IGNORE = ['.', '..', '.git', 'node_modules']

    constructor(readonly path: string) {}

    listFiles = (dir = this.path): fs.TaskEitherNode<string[]> => {
        let readdir = pipe(fs.readdir(dir), TE.map(filterIgnore))
        let recurse = (paths: string[]): fs.TaskEitherNode<string[]> => {
            return pipe(
                traverseArr(paths, (path) => {
                    let filePath = PATH.join(dir, path)

                    return pipe(
                        fs.stat(filePath),
                        TE.chain((stat) =>
                            stat.isDirectory()
                                ? this.listFiles(filePath)
                                : TE.right([PATH.relative(this.path, filePath)]),
                        ),
                    )
                }),
                TE.map((paths) => paths.flat()),
            )
        }

        return pipe(readdir, TE.chain(recurse))
    }

    readFile = (relativePath: string): fs.TaskEitherNode<FileBlob> => {
        let filePath = PATH.join(this.path, relativePath)
        return Do(TE.taskEither)
            .bindL('buffer', () => fs.readFile(filePath))
            .bindL('stat', () => fs.stat(filePath))
            .return(({ buffer, stat }) => new FileBlob(relativePath, buffer, stat))
    }
}

function filterIgnore(paths: string[]): string[] {
    return paths.filter((path) => !Workspace.IGNORE.includes(path))
}
