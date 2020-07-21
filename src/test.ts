import { log} from "fp-ts/lib/Console";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";
import { pipe } from "fp-ts/lib/pipeable";

function echo(args: string[]): TE.TaskEither<Error, void> {
    return pipe(
        validArgs(args),
        TE.fromEither,
        TE.chain((message) => TE.rightIO(log(message)))
    );

    function validArgs(args: string[]): E.Either<Error, string> {
        return args.length
            ? E.right(args.join(" "))
            : E.left(new Error("No message given to echo"));
    }
}

function help(): TE.TaskEither<Error, void> {
    return TE.rightIO(log('Enter "command echo $text" for echo'));
}

let COMMANDS = {
    echo,
    help,
    undefined: help,
};

function main(args: string[]): TE.TaskEither<Error, void> {
    let command = args.shift() as keyof typeof COMMANDS;
    if (Object.keys(COMMANDS).includes(String(command))) {
        return COMMANDS[command](args);
    }
    return TE.left(new Error(`${command} is not recognized`));
}

pipe(
    main(process.argv.slice(2)),
    TE.fold(
        (e) => {
            console.error(e);
            process.exit(1);
        },
        () => process.exit(0)
    )
)();
