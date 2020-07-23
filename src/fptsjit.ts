import { pipe } from 'fp-ts/lib/pipeable'
import * as TE from 'fp-ts/lib/TaskEither'

import { init } from './commands/init'
import { commit } from './commands/commit'

const COMMANDS = {
    init,
    commit,
}

function main(args: string[]): TE.TaskEither<Error, void> {
    const command = args.shift() as keyof typeof COMMANDS
    if (Object.keys(COMMANDS).includes(command)) {
        return COMMANDS[command](...args)
    }
    if (command === undefined)
        return TE.rightIO(() => {
            console.log(`cli help`)
        })
    return TE.leftIO(() => new Error(`fptsjit: ${command} is not a git command.`))
}
pipe(
    main(process.argv.slice(2)),
    TE.fold(
        (error) => {
            console.error(error)
            process.exit(1)
        },
        () => process.exit(0),
    ),
)()
