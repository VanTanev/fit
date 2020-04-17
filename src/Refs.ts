import fs from 'fs'
import path from 'path'

import { Lockfile } from './Lockfile'
import { fileExists } from './utils'

export class Refs {
    private headPath: string

    constructor(gitPath: string) {
        this.headPath = path.join(gitPath, 'HEAD')
    }

    updateHead(oid: string): void {
        const lock = new Lockfile(this.headPath)
        if (!lock.holdForUpdate()) {
            throw new Error(`Could not aquire lock on file: ${this.headPath}`)
        }
        lock.write(`${oid}\n`)
        lock.commit()
    }

    readHead(): string | undefined {
        if (!fileExists(this.headPath)) {
            return undefined
        }

        return fs
            .readFileSync(this.headPath)
            .toString()
            .replace(/^\s+|\s+$/g, '')
    }
}
