import * as PATH from 'path'
import { pipe } from 'fp-ts/lib/pipeable'
import * as TE from 'fp-ts/lib/TaskEither'
import * as A from 'fp-ts/lib/Array'

import * as fs from './fsUtils'
import { Blob, fileBlob, FileBlob } from './database/Blob'

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

    private readFile(filePath: string): fs.TaskEitherNode<FileBlob> {
        return pipe(
            fs.readFile(PATH.join(this.path, filePath)),
            TE.map((buffer) => fileBlob(filePath, new Blob(buffer))),
        )
    }
}
