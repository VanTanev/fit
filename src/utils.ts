import os from 'os'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import zlib from 'zlib'

export class SortedSet<T> extends Set<T> {
    sorted(): T[] {
        return Array.from(super[Symbol.iterator]()).sort()
    }

    [Symbol.iterator](): IterableIterator<T> {
        return this.sorted()[Symbol.iterator]()
    }

    values(): IterableIterator<T> {
        return this.sorted()[Symbol.iterator]()
    }

    entries(): IterableIterator<[T, T]> {
        let nextIndex = 0
        const elements = Array.from(super[Symbol.iterator]()).sort()

        const iterator: IterableIterator<[T, T]> = {
            [Symbol.iterator]: function() {
                return this
            },
            next: function() {
                let result
                if (nextIndex < elements.length) {
                    result = {
                        value: [elements[nextIndex], elements[nextIndex]],
                        done: false,
                    }
                    nextIndex += 1
                    return result
                }

                return {
                    value: [elements[nextIndex], elements[nextIndex]],
                    done: true,
                } as any
            },
        }

        return iterator
    }

    forEach(
        callbackfn: (value: T, value2: T, set: Set<T>) => void,
        thisArg?: any,
    ): void {
        for (const value of this) {
            callbackfn.call(thisArg, value, value, this)
        }
    }
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
