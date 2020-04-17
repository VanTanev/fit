import fs from 'fs'

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
    private parents: Record<string, Set<string>>
    private keys: SortedSet<string>
    private lockfile: Lockfile
    private changed = false

    constructor(private filePath: string) {
        this.entries = {}
        this.parents = {}
        this.keys = new SortedSet()
        this.lockfile = new Lockfile(this.filePath)
    }

    addEntry(filePath: string, oid: string, stat: FileStats): void {
        const entry = Entry.create(filePath, oid, stat)
        this.discardConflicts(entry)
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

    private discardConflicts(entry: Entry): void {
        for (const dir of entry.parentDirectories) {
            this.removeEntry(dir)
        }
        this.removeChildren(entry.path)
    }

    private removeEntry(path: string): void {
        const entry = this.entries[path]
        if (!entry) {
            return
        }
        this.keys.delete(path)
        delete this.entries[path]
        for (const dir of entry.parentDirectories) {
            if (!this.parents[dir]) continue

            this.parents[dir].delete(entry.path)
            if (Object.keys(this.parents[dir]).length === 0) {
                delete this.parents[dir]
            }
        }
    }

    private removeChildren(parentDir: string) {
        if (!this.parents[parentDir]) {
            return
        }

        const children = this.parents[parentDir]
        children.forEach(entry => this.removeEntry(entry))
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

        for (const dir of entry.parentDirectories) {
            const parents = (this.parents[dir] = this.parents[dir] || new Set())
            parents.add(entry.path)
        }
    }

    private openIndexFile(): number | undefined {
        try {
            return fs.openSync(this.filePath, 'r')
        } catch (e) {
            if (e.code === 'ENOENT') {
                return undefined
            }

            throw e
        }
    }

    private clear() {
        this.entries = {}
        this.parents = {}
        this.keys = new SortedSet()
        this.changed = false
    }
}
