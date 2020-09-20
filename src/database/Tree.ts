import * as PATH from 'path'
import { Packer } from 'binary-packer'
import * as M from 'fp-ts/lib/ReadonlyMap'
import * as Ord from 'fp-ts/lib/Ord'
import * as EQ from 'fp-ts/lib/Eq'
import * as O from 'fp-ts/lib/Option'
import { pipe } from 'fp-ts/lib/pipeable'
import invariant from 'tiny-invariant'

import { Storable } from './Storable'
import * as fs from '../fs'

export class Entry {
    constructor(readonly filePath: string, readonly oid: string, readonly stat: fs.Stats) {}

    get mode() {
        return this.stat.userMode
    }
    /**
     * Given a path like "a/b/c/d.txt" this returns:
     * ["a", "a/b", "a/b/c"]
     */
    get parentDirectories(): string[] {
        let dir = PATH.parse(this.filePath).dir
        if (dir.length === 0) return []

        return dir.split(PATH.sep).map((_, i, dirs) => dirs.slice(0, i + 1).join(PATH.sep))
    }

    get basename(): string {
        return PATH.parse(this.filePath).base
    }
}

const byFilePath = pipe(
    Ord.ordString,
    Ord.contramap((e: Entry) => e.filePath),
)

export class Tree extends Storable {
    static ENTRY_FORMAT = 'Z*H40'

    type: 'tree' = 'tree'
    mode: '040000' = '040000'

    constructor(readonly items: ReadonlyMap<string, Entry | Tree> = new Map()) {
        super()
    }

    static build(entries: Entry[]): Tree {
        let root = new Tree()
        for (let entry of entries.sort(byFilePath.compare)) {
            root = root.addEntry(entry.parentDirectories, entry)
        }
        return root
    }

    get trees(): ReadonlyMap<string, Tree> {
        return pipe(
            this.items,
            M.filter((te): te is Tree => te instanceof Tree),
        )
    }

    addEntry(parentDirs: string[], entry: Entry): Tree {
        let insertAt = M.insertAt(EQ.eqString)

        if (parentDirs.length === 0) {
            return new Tree(pipe(this.items, insertAt<Tree | Entry>(entry.basename, entry)))
        }

        let lookup = M.lookup(EQ.eqString)

        let dirname = parentDirs[0]
        let restDirs = parentDirs.slice(1)

        let tree = pipe(
            this.items,
            lookup(dirname),
            O.getOrElse<Tree | Entry>(() => new Tree()),
        )
        // cannot have a file and a directory with the same name
        invariant(tree instanceof Tree)

        return new Tree(
            pipe(
                this.items,
                insertAt<Tree | Entry>(PATH.parse(dirname).base, tree.addEntry(restDirs, entry)),
            ),
        )
    }

    get content(): Buffer {
        let items = pipe(this.items, M.toReadonlyArray(Ord.ordString))
        return Buffer.concat(
            items.map(([path, item]) =>
                new Packer(Tree.ENTRY_FORMAT).pack([`${item.mode} ${path}`, item.oid]),
            ),
        )
    }
}
