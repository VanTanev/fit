import CRYPTO from 'crypto'
import { Do } from 'fp-ts-contrib/lib/Do'
import * as FS from 'fs'
import * as PATH from 'path'

import * as T from 'fp-ts/lib/Task'
import * as TE from 'fp-ts/lib/TaskEither'
import { pipe } from 'fp-ts/lib/pipeable'

// utils

export type TaskEitherNode<A = void> = TE.TaskEither<NodeJS.ErrnoException, A>
const toErrorFS = (e: unknown) => e as NodeJS.ErrnoException

function taskify<F extends (...args: any[]) => any, R = PromiseType<ReturnType<F>>>(
    f: F,
): (...args: Parameters<F>) => TaskEitherNode<R> {
    return function () {
        let args = Array.prototype.slice.call(arguments)
        return TE.tryCatch(() => f.apply(null, args), toErrorFS)
    }
}

type PromiseType<T extends Promise<any>> = T extends Promise<infer U> ? U : never
type NonUndefined<A> = A extends undefined ? never : A
type FunctionKeys<T extends object> = {
    [K in keyof T]-?: NonUndefined<T[K]> extends Function ? K : never
}[keyof T]

function taskifyFileHandle<
    R extends PromiseType<ReturnType<FS.promises.FileHandle[K]>>,
    K extends FunctionKeys<FS.promises.FileHandle>
>(
    m: K,
): (
    h: FS.promises.FileHandle,
    ...args: Parameters<FS.promises.FileHandle[K]>
) => TaskEitherNode<R> {
    return function () {
        let args = Array.prototype.slice.call(arguments)
        return TE.tryCatch(() => args[0][m].apply(args[0], args.slice(1)), toErrorFS)
    }
}

// definitions

export const open: (
    path: FS.PathLike,
    flags: string | number,
    mode?: FS.Mode,
) => TaskEitherNode<FS.promises.FileHandle> = taskify(FS.promises.open)
export const close = taskifyFileHandle('close')

export const writeFile = taskify(FS.promises.writeFile)
const mkdir = taskify(FS.promises.mkdir)
export const mkdirp = (path: FS.PathLike, options: FS.MakeDirectoryOptions = {}) =>
    mkdir(path, { ...options, recursive: true })
export const readdir = TE.taskify<FS.PathLike, NodeJS.ErrnoException, string[]>(FS.readdir)
export const readFile = taskify(FS.promises.readFile)

export type Stats = FS.BigIntStats & { userMode: '100644' | '100755' }
export const stat = (filePath: FS.PathLike): TaskEitherNode<Stats> => {
    let stat = TE.taskify<FS.PathLike, { bigint: true }, NodeJS.ErrnoException, FS.BigIntStats>(
        FS.stat as any,
    )
    let userMode = pipe(
        TE.tryCatch(() => FS.promises.access(filePath, FS.constants.X_OK), toErrorFS),
        TE.map(() => '100755' as const),
        TE.orElse((e) => (e.code === 'EACCES' ? TE.right('100644' as const) : TE.left(e))),
    )

    return Do(TE.taskEither)
        .bindL('stat', () => stat(filePath, { bigint: true }))
        .bind('userMode', userMode)
        .return(({ stat, userMode }) => Object.assign(stat, { userMode }))
}

export const rename = (filePathFrom: FS.PathLike, filePathTo: FS.PathLike): TaskEitherNode =>
    TE.tryCatch(() => FS.promises.rename(filePathFrom, filePathTo), toErrorFS)

export const unlink = (filePath: FS.PathLike): TaskEitherNode =>
    TE.tryCatch(() => FS.promises.unlink(filePath), toErrorFS)
export function fileExists(filePath: FS.PathLike): T.Task<boolean> {
    return async () => {
        try {
            await FS.promises.access(filePath, FS.constants.F_OK)
            return true
        } catch (e) {
            return false
        }
    }
}

/**
 * Write to a temp file first, and then rename to final destination
 */
export function writeFileCrashSafe(filePath: string, content: string | Buffer): TaskEitherNode {
    let dir = PATH.dirname(filePath)
    let tempPath = PATH.join(dir, generateTempName())

    return pipe(
        openOrCreateFileForWriting(tempPath),
        TE.chainFirst((file) => writeFile(file, content)),
        TE.chain(close),
        TE.chain(() => rename(tempPath, filePath)),
    )
}

const generateTempName = (): string => 'tmp_object_' + CRYPTO.randomBytes(20).toString('hex')

export function openOrCreateFileForWriting(
    filePath: string,
): TaskEitherNode<FS.promises.FileHandle> {
    return pipe(
        open(filePath, 'wx+'),
        TE.orElse((e) =>
            // if we get ENOENT (no such file or directory), that means the
            // containing directory does not exist
            e.code === 'ENOENT'
                ? pipe(
                      // try to create the directory for the file
                      mkdirp(PATH.dirname(filePath)),
                      // and retry opening
                      TE.chain(() => open(filePath, 'wx+')),
                  )
                : TE.left(e),
        ),
    )
}
