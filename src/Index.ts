import * as CRYPTO from 'crypto'
import * as TE from 'fp-ts/lib/TaskEither'
import {pipe} from 'fp-ts/lib/pipeable'

import {FileBlob} from './database/Blob'
import {Lockfile, StaleLock} from './Lockfile'
import {Packer} from 'binary-packer'
// import * as fs from './fsUtils'


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
        public filePath: string) {}

    static create({filePath, stat, oid}: FileBlob): Entry {
        let mode = stat.userMode === '100755' ? Entry.EXECUTABLE_MODE : Entry.REGULAR_MODE
        let flags = Math.min(Entry.MAX_PATH_SIZE, Buffer.from(filePath).byteLength)


        return new Entry(
            toTimestamp(stat.ctime),
            toMsec(stat.ctimeNs),
            toTimestamp(stat.mtime),
            toMsec(stat.mtimeNs),
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

let toMsec = (n: bigint): bigint => BigInt(n) % BigInt(1_000_000_000)
let toTimestamp = (d: Date): number => Math.floor(+d) / 1000

export class Index {
    static SIGNATURE = 'DIRC'
    static VERSION = 2
    static HEADER_SIZE = 12
    static HEADER_FORMAT = 'a4N2'
    constructor(readonly lock: Lockfile, readonly entries: ReadonlyMap<string, Entry> = new Map()) {}

    add(file: FileBlob): Index {
        let entries = new Map(this.entries)
        entries.set(file.filePath, Entry.create(file))
        return new Index(this.lock, entries)
    }

    writeUpdates(): TE.TaskEither<Error, Index> {
        let writer = new Checksum(this.lock)
        const header = new Packer(Index.HEADER_FORMAT).pack([
            Index.SIGNATURE,
            Index.VERSION,
            this.entries.size
        ])
        return pipe(
            writer.write(header),
            TE.chain(() => writer.commit()),
            TE.map(() => this)
            // TE.chain(writer => {
            // })
        )
    }
}

export class Checksum {
    static CHECKSUM_SIZE = 20
    private hash = CRYPTO.createHash('sha1')

    constructor(readonly lock: Lockfile) {}

    write(data: Buffer): TE.TaskEither<NodeJS.ErrnoException | StaleLock, Checksum> {
        return pipe(
            this.lock.write(data),
            TE.map(() => {
                this.hash.update(data)
                return this
            })
        )
    }

    commit(): TE.TaskEither<NodeJS.ErrnoException, void> {
        return pipe(
            this.lock.write(this.hash.digest()),
            TE.chain(lock => lock.commit())
        )
    }

}
