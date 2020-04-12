import crypto from 'crypto'

import { Blob }  from './database/Blob'
import { FileStats } from './Workspace'
import { Lockfile } from './Lockfile'
import { Packer } from 'binary-packer'
import { SortedSet, invariant } from './utils'
import { Entry } from './index/Entry'

export class Index {
    static HEADER_FORMAT = 'a4N2'

    private entries: Record<string, Entry>
    private keys: SortedSet<string>
    private lockfile: Lockfile
    private sha1digest?: crypto.Hash

    constructor(private filePath: string) {
        this.entries = {}
        this.keys = new SortedSet()
        this.lockfile = new Lockfile(this.filePath)
    }

    addEntry(filePath: string, blob: Blob, stat: FileStats): void {
        const entry = Entry.create(filePath, blob.oid!, stat)
        this.keys.add(entry.key)
        this.entries[entry.key] = entry
    }

    eachEntry(callbackfn: (value: Entry) => void, thisArg?: any): void {
        this.keys.forEach(key => callbackfn.call(thisArg, this.entries[key]))
    }

    writeUpdates(): boolean {
        if (!this.lockfile.holdForUpdate()) {
            return false
        }
        this.beginWrite()

        const header = new Packer(Index.HEADER_FORMAT).pack([
            'DIRC',
            2,
            this.keys.size,
        ])
        this.write(header)

        this.eachEntry(entry => this.write(entry.buffer))

        this.finishWrite()

        return true
    }

    private beginWrite(): void {
        this.sha1digest = crypto.createHash('sha1')
    }

    private write(data: Buffer): void {
        invariant(this.sha1digest)
        this.lockfile.write(data)
        this.sha1digest.update(data)
    }

    private finishWrite(): void {
        invariant(this.sha1digest)
        this.lockfile.write(this.sha1digest.digest())
        this.lockfile.commit()
    }
}
