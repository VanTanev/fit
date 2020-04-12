import fs from 'fs'
import path from 'path'

import Entry, { Mode } from './Entry'

const IGNORE = ['.', '..', '.git', 'node_modules', 'test-git']

export type FileStats = fs.BigIntStats & { user_mode: Mode }

export default class Workspace {
    constructor(private path: string) {}

    listFiles(fileOrDir = this.path): string[] {
        const stat = fs.statSync(fileOrDir)
        if (stat.isFile()) {
            return [path.relative(this.path, fileOrDir)]
        } else {
            const filePaths = fs
                .readdirSync(fileOrDir)
                .filter(dir => !IGNORE.includes(dir))
                // reduce() used to hack a flatMap()
                .reduce<string[]>((filePaths, filePath) => {
                    filePath = path.join(fileOrDir, filePath)
                    const stat = fs.statSync(filePath)
                    return stat.isDirectory()
                        ? [...filePaths, ...this.listFiles(filePath)]
                        : [...filePaths, path.relative(this.path, filePath)]
                }, [])

            return filePaths
        }
    }

    readFile(fileName: string): Buffer {
        return fs.readFileSync(path.join(this.path, fileName))
    }

    statFile(fileName: string): FileStats {
        const stat = fs.statSync(fileName, { bigint: true })

        let user_mode: Mode
        try {
            fs.accessSync(fileName, fs.constants.X_OK)
            user_mode = Entry.EXEC_MODE
        } catch (e) {
            if (e.code === 'EACCES') {
                user_mode = Entry.READ_MODE
            } else {
                throw e
            }
        }
        return { ...stat, user_mode }
    }
}
