import * as PATH from 'path'

import { pipe } from 'fp-ts/lib/pipeable'
import * as A from 'fp-ts/lib/Array'
import * as C from 'fp-ts/lib/Console'
import * as TE from 'fp-ts/lib/TaskEither'

import * as fs from '../fsUtils'

export function init(path = process.cwd()): TE.TaskEither<Error, void> {
    let gitPath = PATH.join(path, '.git')
    let paths = [PATH.join(gitPath, 'objects'), PATH.join(gitPath, 'refs')]

    return pipe(
        A.array.traverse(TE.getTaskValidation(A.getMonoid<Error>()))(
            paths.map((path) => fs.mkdir(path)),
            TE.mapLeft(A.of),
        ),
        TE.fold(
            (errors) => TE.left(new Error(errors.map((e) => e.message).join('\n'))),
            () => TE.rightIO(C.log(`Initialized empty fptsjit repository in ${gitPath}`)),
        ),
    )
}
