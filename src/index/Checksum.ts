import crypto from 'crypto'
import fs from 'fs'

export class Checksum {
    static CHECKSUM_SIZE = 20
    private digest: crypto.Hash

    constructor(private fileDescriptor: number) {
        this.digest = crypto.createHash('sha1')
    }

    read(size: number): Buffer {
        const buff = Buffer.allocUnsafe(size)
        if (size !== fs.readSync(this.fileDescriptor, buff, 0, size, null)) {
            throw new Error('Unexpected end-of-file while reading index')
        }
        this.digest.update(buff)
        return buff
    }

    write(data: Buffer): void {
        fs.writeSync(this.fileDescriptor, data, null)
        this.digest.update(data)
    }

    writeChecksum() {
        fs.writeSync(this.fileDescriptor, this.digest.digest(), null)
    }

    verifyChecksum(): void {
        const checksum = this.read(Checksum.CHECKSUM_SIZE)
        if (!Buffer.compare(checksum, this.digest.digest())) {
            throw new Error('Checksum does not match value stored on disk')
        }
    }
}
