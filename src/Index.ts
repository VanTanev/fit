import crypto from 'crypto'

import Blob from './database/Blob'
import { FileStats } from './Workspace'
import Lockfile from './Lockfile'
import Entry from './Entry'
import { Packer } from 'binary-packer'
import { SortedSet, invariant } from './utils'

export default class Index {
    static HEADER_FORMAT = 'a4N2'

    private entries: Record<string, IndexEntry>
    private keys: SortedSet<string>
    private lockfile: Lockfile
    private sha1digest?: crypto.Hash

    constructor(private filePath: string) {
        this.entries = {}
        this.keys = new SortedSet()
        this.lockfile = new Lockfile(this.filePath)
    }

    addEntry(filePath: string, blob: Blob, stat: FileStats): void {
        const entry = IndexEntry.create(filePath, blob.oid!, stat)
        this.keys.add(entry.key)
        this.entries[entry.key] = entry
    }

    eachEntry(callbackfn: (value: IndexEntry) => void, thisArg?: any): void {
        this.keys.forEach(key => callbackfn.call(thisArg, this.entries[key]))
    }

    loadForUpdate(): boolean {
        if (this.lockfile.holdForUpdate()) {
            this.load()
            return true
        }

        return false
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

    private load(): void {}

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

class IndexEntry {
    static ENTRY_FORMAT = 'N10H40nZ*'

    static REGULAR_MODE = 0o0100644 as const
    static EXECUTABLE_MODE = 0o0100755 as const
    static MAX_PATH_SIZE = 0xfff
    static ENTRY_BLOCK = 8

    constructor(
        public ctime: number,
        public ctimeNsec: bigint,
        public mtime: number,
        public mtimeNsec: bigint,
        public dev: bigint,
        public ino: bigint,
        public mode:
            | typeof IndexEntry.REGULAR_MODE
            | typeof IndexEntry.EXECUTABLE_MODE,
        public uid: bigint,
        public gid: bigint,
        public size: bigint,

        public oid: string,
        public flags: number,
        public path: string,
    ) {}

    get buffer(): Buffer {
        let buff = new Packer(IndexEntry.ENTRY_FORMAT).pack([
            this.ctime,
            Number(this.ctimeNsec),
            this.mtime,
            Number(this.mtimeNsec),
            Number(this.dev),
            Number(this.ino),
            this.mode,
            Number(this.uid),
            Number(this.gid),
            Number(this.size),
            this.oid,
            this.flags,
            this.path,
        ])

        if (buff.byteLength % IndexEntry.ENTRY_BLOCK !== 0) {
            buff = Buffer.concat([
                buff,
                Buffer.alloc(8 - (buff.byteLength % IndexEntry.ENTRY_BLOCK)),
            ])
        }

        return buff
    }

    get key() {
        return this.path
    }

    static create(filePath: string, oid: string, stat: FileStats): IndexEntry {
        const mode =
            stat.user_mode === Entry.EXEC_MODE
                ? IndexEntry.EXECUTABLE_MODE
                : IndexEntry.REGULAR_MODE
        const flags = Math.min(
            IndexEntry.MAX_PATH_SIZE,
            Buffer.from(filePath).byteLength,
        )
        return new IndexEntry(
            Math.floor(stat.ctime.getTime() / 1000),
            // TODO
            // BigInt.asUintN(32, BigInt(stat.ctimeNs) % BigInt(1_000_000_000)),
            BigInt(stat.ctimeNs) % BigInt(1_000_000_000),
            Math.floor(stat.mtime.getTime() / 1000),
            BigInt(stat.mtimeNs) % BigInt(1_000_000_000),
            BigInt(stat.dev),
            BigInt(stat.ino),
            mode,
            BigInt(stat.uid),
            BigInt(stat.gid),
            BigInt(stat.size),

            oid,
            flags,
            filePath,
        )
    }
}

