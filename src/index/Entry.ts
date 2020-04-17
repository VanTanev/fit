import { FileStats } from '../Workspace'
import { Entry as DatabaseEntry } from '../Entry'
import { Packer } from 'binary-packer'
import path from 'path'

export class Entry {
    static ENTRY_FORMAT = 'N10H40nZ*'

    static REGULAR_MODE = 0o0100644 as const
    static EXECUTABLE_MODE = 0o0100755 as const
    static MAX_PATH_SIZE = 0xfff
    static ENTRY_BLOCK = 8
    static ENTRY_MIN_SIZE = 64

    constructor(
        public ctime: number,
        public ctimeNsec: bigint,
        public mtime: number,
        public mtimeNsec: bigint,
        public dev: bigint,
        public ino: bigint,
        public mode: typeof Entry.REGULAR_MODE | typeof Entry.EXECUTABLE_MODE,
        public uid: bigint,
        public gid: bigint,
        public size: bigint,

        public oid: string,
        public flags: number,
        public path: string,
    ) {}

    get parentDirectories(): string[] {
        const parsed = path.parse(this.path)
        return parsed.dir.length === 0 ? [] : parsed.dir.split(path.sep)
    }

    get basename(): string {
        return path.parse(this.path).base
    }

    get buffer(): Buffer {
        let buff = new Packer(Entry.ENTRY_FORMAT).pack([
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

        if (buff.byteLength % Entry.ENTRY_BLOCK !== 0) {
            buff = Buffer.concat([
                buff,
                Buffer.alloc(8 - (buff.byteLength % Entry.ENTRY_BLOCK)),
            ])
        }

        return buff
    }

    get key() {
        return this.path
    }

    static create(filePath: string, oid: string, stat: FileStats): Entry {
        const mode =
            stat.user_mode === DatabaseEntry.EXEC_MODE
                ? Entry.EXECUTABLE_MODE
                : Entry.REGULAR_MODE
        const flags = Math.min(
            Entry.MAX_PATH_SIZE,
            Buffer.from(filePath).byteLength,
        )
        return new Entry(
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

    static parse(buf: Buffer): Entry {
        const data = new Packer(Entry.ENTRY_FORMAT).unpack(buf)
        return new (Entry as any)(...data)
    }
}
