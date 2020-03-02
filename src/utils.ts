import os from 'os'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import zlib from 'zlib'

const homeDirectory = os.homedir()

export function resolvePath(targetPath: string): string {
    return path.resolve(targetPath.replace(/^~(?=$|\/|\\)/, homeDirectory))
}

export function sha1(data: string | Buffer) {
    if (typeof data === 'string') {
        return crypto
            .createHash('sha1')
            .update(data, 'utf8')
            .digest('hex')
    }

    return crypto
        .createHash('sha1')
        .update(data)
        .digest('hex')
}

export function deflate(data: string | Buffer) {
    if (typeof data === 'string') {
        return zlib.deflateSync(Buffer.from(data, 'utf8'), {
            level: zlib.constants.Z_MAX_LEVEL,
        })
    }

    return zlib.deflateSync(data, { level: zlib.constants.Z_MAX_LEVEL })
}

export function fileExists(filePath: string) {
    try {
        fs.accessSync(filePath, fs.constants.F_OK)
        return true
    } catch (e) {
        return false
    }
}
