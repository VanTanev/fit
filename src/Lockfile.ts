import fs from 'fs'

export default class Lockfile {
    private lockPath: string
    private lock: number | undefined

    constructor(private filePath: string) {
        this.lockPath = this.filePath + '.lock'
    }

    holdForUpdate(): boolean {
        try {
            if (!this.lock) {
                const flags =
                    fs.constants.O_RDWR |
                    fs.constants.O_CREAT |
                    fs.constants.O_EXCL
                this.lock = fs.openSync(this.lockPath, flags)
            }
            return true
        } catch (e) {
            switch (e.code) {
                case 'EEXIST': {
                    return false
                }
                case 'ENOENT':
                case 'EACCESS':
                default:
                    throw e
            }
        }
    }

    write(data: string | Buffer): void {
        this.assertLock(this.lock)

        fs.writeFileSync(this.lock, data)
    }

    commit(): void {
        this.assertLock(this.lock)

        fs.closeSync(this.lock)
        this.lock = void 0
        fs.renameSync(this.lockPath, this.filePath)
    }

    private assertLock(lock: number | undefined): asserts lock is number {
        if (!lock) {
            throw new Error(`Not holding a lock on file ${this.lockPath}`)
        }
    }
}
