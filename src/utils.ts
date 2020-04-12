import os from 'os'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import zlib from 'zlib'

export class SortedSet<T> extends Set<T> {
    forEach(
        callbackfn: (value: T, value2: T, set: Set<T>) => void,
        thisArg?: any,
    ): void {
        ;[...this].sort().forEach(v => callbackfn.call(thisArg, v, v, this))
    }

    // TODO use values() method to generate a sorted iterator?
}
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

export function invariant(
    condition: any,
    message: string = 'Invariant violation',
): asserts condition {
    if (!condition) {
        throw new Error(message)
    }
}
