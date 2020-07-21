import * as PATH from 'path'
import { pipe } from 'fp-ts/lib/pipeable'
import * as IE from 'fp-ts/lib/IOEither'
import * as A from 'fp-ts/lib/Array'
import type { IOEitherNode } from './fsUtils'

import * as fs from './fsUtils'
import { Blob, fileBlob, FileBlob } from './database/Blob'

export class Workspace {
    static IGNORE = ['.', '..', '.git', 'node_modules']

    constructor(private path: string) {}

    readFile(filePath: string): IOEitherNode<FileBlob> {
        return pipe(
            fs.readFileSync(PATH.join(this.path, filePath)),
            IE.map((buffer) => fileBlob(filePath, new Blob(buffer))),
        )
    }

    readFiles(paths: string[]): IOEitherNode<FileBlob[]> {
        return A.array.traverse(IE.ioEither)(paths, (path) => this.readFile(path))
    }

    listFiles(): IOEitherNode<string[]> {
        return pipe(fs.readdirSync(this.path), IE.map(this.filterDirs))
    }

    private filterDirs(dirs: string[]): string[] {
        return dirs.filter((dir) => !Workspace.IGNORE.includes(dir))
    }
}
