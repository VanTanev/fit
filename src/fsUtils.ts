import CRYPTO from 'crypto'
import { Do } from 'fp-ts-contrib/lib/Do'
import * as FS from 'fs'
import * as PATH from 'path'

import * as T from 'fp-ts/lib/Task'
import * as TE from 'fp-ts/lib/TaskEither'
import { pipe } from 'fp-ts/lib/pipeable'

export type TaskEitherNode<A = void> = TE.TaskEither<NodeJS.ErrnoException, A>

export const open = (
    filePath: FS.PathLike,
    mode: FS.Mode,
): TaskEitherNode<FS.promises.FileHandle> =>
    TE.tryCatch(() => FS.promises.open(filePath, mode), toErrorFS)

export const writeFile = (
    file: FS.promises.FileHandle | FS.PathLike,
    content: string | Buffer,
): TaskEitherNode => TE.tryCatch(() => FS.promises.writeFile(file, content), toErrorFS)

export const close = (file: FS.promises.FileHandle): TaskEitherNode =>
    TE.tryCatch(() => file.close(), toErrorFS)

export const mkdir = (dirPath: string, opts: FS.MakeDirectoryOptions = {}): TaskEitherNode =>
    TE.tryCatch(
        () => FS.promises.mkdir(dirPath, { recursive: true, ...opts }).then(() => {}),
        toErrorFS,
    )

export const readdir = (dirPath: FS.PathLike): TaskEitherNode<string[]> =>
    TE.tryCatch(() => FS.promises.readdir(dirPath), toErrorFS)

export const readFile = (filePath: FS.PathLike): TaskEitherNode<Buffer> =>
    TE.tryCatch(() => FS.promises.readFile(filePath), toErrorFS)

export type Stats = FS.BigIntStats & { userMode: '100644' | '100755' }
export const stat = (filePath: FS.PathLike): TaskEitherNode<Stats> => {
    let stat = TE.tryCatch(
        () =>
            ((FS.promises.stat as unknown) as (
                path: FS.PathLike,
                opts?: any,
            ) => Promise<FS.BigIntStats>)(filePath, { bigint: true }),
        toErrorFS,
    )
    let userMode = pipe(
        TE.tryCatch(() => FS.promises.access(filePath, FS.constants.X_OK), toErrorFS),
        TE.map(() => '100755' as const),
        TE.orElse((e) => (e.code === 'EACCES' ? TE.right('100644' as const) : TE.left(e))),
    )

    return Do(TE.taskEither)
        .bind('stat', stat)
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
                      mkdir(PATH.dirname(filePath)),
                      // and retry opening
                      TE.chain(() => open(filePath, 'wx+')),
                  )
                : TE.left(e),
        ),
    )
}

const toErrorFS = (e: unknown) => e as NodeJS.ErrnoException
