import { pipe } from 'fp-ts/lib/pipeable'
import * as IE from 'fp-ts/lib/IOEither'

import { init } from './commands/init'
import { commit } from './commands/commit'

const COMMANDS = {
    init,
    commit,
}

function main(args: string[]): IE.IOEither<Error, void> {
    const command = args.shift() as keyof typeof COMMANDS
    if (Object.keys(COMMANDS).includes(command)) {
        return COMMANDS[command](...args)
    }
    if (command === undefined)
        return IE.rightIO(() => {
            console.log(`cli help`)
        })
    return IE.leftIO(() => new Error(`fptsjit: ${command} is not a git command.`))
}
pipe(
    main(process.argv.slice(2)),
    IE.fold(
        (error) => {
            console.error(error)
            process.exit(1)
        },
        () => process.exit(0),
    ),
)()
