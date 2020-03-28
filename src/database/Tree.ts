import Entry from '../Entry'
import path from 'path'
import Pack from '../Pack/Pack'

export default class Tree implements Storable {
    static ENTRY_FORMAT = new Pack('Z*H20')

    static build(entries: Entry[]): Tree {
        entries = Tree.sortEntries(entries)
        const root = new Tree()
        entries.forEach(entry => {
            const parsed = path.parse(entry.path)
            const dirs =
                parsed.dir.length === 0 ? [] : parsed.dir.split(path.sep)
            root.addEntry(dirs, parsed.base, entry)
        })
        return root
    }

    static sortEntries(entries: Entry[]): Entry[] {
        const compare = new Intl.Collator(undefined, {}).compare
        return entries.slice().sort((e1, e2) => compare(e1.path, e2.path))
    }

    public oid?: string
    public entries: Record<string, Entry | Tree> = {}
    constructor() {}

    addEntry(dirs: string[], basename: string, entry: Entry) {
        if (dirs.length === 0) {
            this.entries[basename] = entry
        } else {
            const dirname = dirs[0]
            this.entries[dirname] = this.entries[dirname] || new Tree()

            const tree = this.entries[dirname] as Tree
            tree.addEntry(dirs.slice(1), basename, entry)
        }
    }

    get type() {
        return 'tree' as const
    }

    get mode() {
        return Entry.DIR_MODE
    }

    traverse(cb: (tree: Tree) => void): void {
        for (const name in this.entries) {
            const entry = this.entries[name]
            if (entry instanceof Tree) {
                entry.traverse(cb)
            }
        }

        cb(this)
    }

    get buffer(): Buffer {
        const buffers: Buffer[] = []
        for (const name in this.entries) {
            const entry = this.entries[name]
            buffers.push(
                Tree.ENTRY_FORMAT.pack([`${entry.mode} ${name}`, entry.oid!]),
            )
        }

        return Buffer.concat(buffers)
    }
}
