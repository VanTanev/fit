import { pipe } from 'fp-ts/lib/pipeable'
import * as TE from 'fp-ts/lib/TaskEither'
import * as C from 'fp-ts/lib/Console'

import { init } from './commands/init'
import { commit } from './commands/commit'
import { add } from './commands/add'

const COMMANDS = {
    init,
    commit,
    add
}

function main(args: string[]): TE.TaskEither<Error, void> {
    const command = args.shift() as keyof typeof COMMANDS
    if (Object.keys(COMMANDS).includes(command)) {
        return COMMANDS[command](...args)
    }

    if (command === undefined) {
        return TE.rightIO(C.log('cli help'))
    }

    return TE.left(new Error(`fptsjit: ${command} is not a git command.`))
}

pipe(
    main(process.argv.slice(2)),
    TE.fold(onError, () => process.exit(0)),
)()
process.on('unhandledRejection', onError)

function onError(e: Error): never {
    console.error(e)
    process.exit(1)
}
