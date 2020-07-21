import CRYPTO from 'crypto'
import * as FS from 'fs'
import * as PATH from 'path'

import * as IO from 'fp-ts/lib/IO'
import * as IE from 'fp-ts/lib/IOEither'
import { pipe } from 'fp-ts/lib/pipeable'

export type IOEitherNode<A = void> = IE.IOEither<NodeJS.ErrnoException, A>

export const openSync = (filePath: string, mode: FS.Mode): IOEitherNode<number> =>
    IE.tryCatch(() => FS.openSync(filePath, mode), toErrorFS)

export const writeFileSync = (file: string | number, content: string | Buffer): IOEitherNode =>
    IE.tryCatch(() => FS.writeFileSync(file, content), toErrorFS)

export const closeSync = (file: number): IOEitherNode =>
    IE.tryCatch(() => FS.closeSync(file), toErrorFS)

export const mkdirSync = (dirPath: string): IOEitherNode =>
    IE.tryCatch(() => {
        FS.mkdirSync(dirPath, { recursive: true })
    }, toErrorFS)

export const readdirSync = (dirPath: string): IOEitherNode<string[]> =>
    IE.tryCatch(() => FS.readdirSync(dirPath), toErrorFS)

export const readFileSync = (filePath: string): IOEitherNode<Buffer> =>
    IE.tryCatch(() => FS.readFileSync(filePath), toErrorFS)

export const renameSync = (filePathFrom: string, filePathTo: string): IOEitherNode =>
    IE.tryCatch(() => FS.renameSync(filePathFrom, filePathTo), toErrorFS)

export function fileExists(filePath: string): IO.IO<boolean> {
    return IO.fromIO(() => {
        try {
            FS.accessSync(filePath, FS.constants.F_OK)
            return true
        } catch (e) {
            return false
        }
    })
}

/**
 * Write to a temp file first, and then rename to final destination
 */
export function writeFileSyncCrashSafe(
    filePath: string,
    content: string | Buffer,
): IE.IOEither<NodeJS.ErrnoException, void> {
    let dir = PATH.dirname(filePath)
    let temp = PATH.join(dir, 'tmp_object_' + CRYPTO.randomBytes(20).toString('hex'))

    return pipe(
        openOrCreateFileForWriting(temp),
        IE.chainFirst((file) => writeFileSync(file, content)),
        IE.chain(closeSync),
        IE.chain(() => renameSync(temp, filePath)),
    )
}

export function openOrCreateFileForWriting(filePath: string): IOEitherNode<number> {
    let dir = PATH.dirname(filePath)

    return pipe(
        openSync(filePath, 'wx+'),
        IE.orElse((e) =>
            // if we get ENOENT
            e.code === 'ENOENT'
                ? pipe(
                      // try to create the directory for the file
                      mkdirSync(dir),
                      // and retry opening
                      IE.chain(() => openSync(filePath, 'wx+')),
                  )
                : IE.left(e),
        ),
    )
}

function toErrorFS(e: unknown) {
    return e as NodeJS.ErrnoException
}
