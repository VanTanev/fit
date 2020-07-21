import CRYPTO from 'crypto'
import ZLIB from 'zlib'

export function sha1(data: string | Buffer): string {
    let sha1 = CRYPTO.createHash('sha1')
    if (typeof data === 'string') {
        sha1 = sha1.update(data, 'utf8')
    } else {
        sha1 = sha1.update(data)
    }
    return sha1.digest('hex')
}

export function deflate(data: string | Buffer) {
    if (typeof data === 'string') {
        return ZLIB.deflateSync(Buffer.from(data, 'utf8'), {
            level: ZLIB.constants.Z_MAX_LEVEL,
        })
    }

    return ZLIB.deflateSync(data, { level: ZLIB.constants.Z_MAX_LEVEL })
}
