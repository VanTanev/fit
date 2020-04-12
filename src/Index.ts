import fs from 'fs'

import { Blob } from './database/Blob'
import { FileStats } from './Workspace'
import { Lockfile } from './Lockfile'
import { Packer } from 'binary-packer'
import { SortedSet } from './utils'
import { Entry } from './index/Entry'
import { Checksum } from './index/Checksum'

export class Index {
    static SIGNATURE = 'DIRC'
    static VERSION = 2
    static HEADER_SIZE = 12
    static HEADER_FORMAT = 'a4N2'

    private entries: Record<string, Entry>
    private keys: SortedSet<string>
    private lockfile: Lockfile
    private changed = false

    constructor(private filePath: string) {
        this.entries = {}
        this.keys = new SortedSet()
        this.lockfile = new Lockfile(this.filePath)
    }

    addEntry(filePath: string, blob: Blob, stat: FileStats): void {
        const entry = Entry.create(filePath, blob.oid!, stat)
        this.storeEntry(entry)
        this.changed = true
    }

    eachEntry(callbackfn: (value: Entry) => void, thisArg?: any): void {
        for (const key of this.keys) {
            callbackfn.call(thisArg, this.entries[key])
        }
    }

    sortedEntries() {
        return this.keys.sorted().map(key => this.entries[key])
    }

    loadForUpdate(): boolean {
        if (this.lockfile.holdForUpdate()) {
            this.load()
            return true
        }

        return false
    }

    writeUpdates(): void {
        if (!this.changed) {
            return this.lockfile.rollback()
        }

        const writer = new Checksum(this.lockfile.lock!)

        const header = new Packer(Index.HEADER_FORMAT).pack([
            Index.SIGNATURE,
            Index.VERSION,
            this.keys.size,
        ])
        writer.write(header)

        this.eachEntry(entry => writer.write(entry.buffer))

        writer.writeChecksum()
        this.lockfile.commit()

        this.changed = false
    }

    load(): void {
        this.clear()
        const file = this.openIndexFile()
        if (!file) {
            return
        }

        try {
            const reader = new Checksum(file)
            const count = this.readHeader(reader)
            this.readEntries(reader, count)
            reader.verifyChecksum()
        } finally {
            fs.closeSync(file)
        }
    }

    private readHeader(reader: Checksum): number {
        const [, , count] = new Packer(Index.HEADER_FORMAT).unpack<
            [string, number, number]
        >(reader.read(Index.HEADER_SIZE))
        return count
    }

    private readEntries(reader: Checksum, count: number): void {
        let i = -1
        while (++i < count) {
            let entry = reader.read(Entry.ENTRY_MIN_SIZE)
            while (entry.readInt8(entry.byteLength - 1) !== 0) {
                entry = Buffer.concat([entry, reader.read(Entry.ENTRY_BLOCK)])
            }
            this.storeEntry(Entry.parse(entry))
        }
    }

    private storeEntry(entry: Entry): void {
        this.keys.add(entry.key)
        this.entries[entry.key] = entry
    }

    private openIndexFile(): number {
        return fs.openSync(this.filePath, 'r')
    }

    private clear() {
        this.entries = {}
        this.keys = new SortedSet()
        this.changed = false
    }
}
