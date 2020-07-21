import * as PATH from 'path'
import * as FS from 'fs'

import { pipe } from 'fp-ts/lib/pipeable'
import * as A from 'fp-ts/lib/Array'
import * as C from 'fp-ts/lib/Console'
import * as E from 'fp-ts/lib/Either'
import * as IE from 'fp-ts/lib/IOEither'

export function init(path = process.cwd()): IE.IOEither<Error, void> {
    let gitPath = PATH.join(path, '.git')
    let paths = [PATH.join(gitPath, 'objects'), PATH.join(gitPath, 'refs')]

    return pipe(
        A.array.traverse(IE.getIOValidation(A.getMonoid<Error>()))(
            paths.map(createPath),
            IE.mapLeft(A.of),
        ),
        IE.fold(
            (errors) => IE.left(new Error(errors.map((e) => e.message).join('\n'))),
            () => IE.rightIO(C.log(`Initialized empty fptsjit repository in ${gitPath}`)),
        ),
    )
}

function createPath(path: string): IE.IOEither<Error, string> {
    return IE.tryCatch(() => FS.mkdirSync(path, { recursive: true }), E.toError)
}
