import * as PATH from 'path'

import { pipe } from 'fp-ts/lib/pipeable'
import * as TE from 'fp-ts/lib/TaskEither'
import * as A from 'fp-ts/lib/Array'
import { Do } from 'fp-ts-contrib/lib/Do'

import * as fs from './fsUtils'
import { fileBlob, FileBlob } from './database/Blob'

export class Workspace {
    static IGNORE = ['.', '..', '.git', 'node_modules']

    constructor(private path: string) {}

    readFilesInWorkspace(): fs.TaskEitherNode<FileBlob[]> {
        return pipe(
            this.listFiles(),
            TE.chain((paths) =>
                A.array.traverse(TE.taskEither)(paths, (path) => this.readFile(path)),
            ),
        )
    }

    listFiles(): fs.TaskEitherNode<string[]> {
        return pipe(fs.readdir(this.path), TE.map(this.filterDirs))
    }

    private filterDirs(dirs: string[]): string[] {
        return dirs.filter((dir) => !Workspace.IGNORE.includes(dir))
    }

    private readFile(relativePath: string): fs.TaskEitherNode<FileBlob> {
        let filePath = PATH.join(this.path, relativePath)
        return Do(TE.taskEither)
            .bindL('buffer', () => fs.readFile(filePath))
            .bindL('stat', () => fs.stat(filePath))
            .return(({ buffer, stat }) => fileBlob(relativePath, buffer, stat))
    }
}
