import { Entry } from '../index/Entry'
import { Packer } from 'binary-packer'
import { Storable } from '../Storable'

export class Tree implements Storable {
    static TREE_MODE = 0o040000
    static ENTRY_FORMAT = 'Z*H40'

    static build(entries: Entry[]): Tree {
        const root = new Tree()
        entries.forEach(entry => {
            root.addEntry(entry.parentDirectories, entry)
        })
        return root
    }

    public oid?: string
    public entries: Record<string, Entry | Tree> = {}
    constructor() {}

    addEntry(parents: string[], entry: Entry) {
        if (parents.length === 0) {
            this.entries[entry.basename] = entry
        } else {
            const tree = (this.entries[parents[0]] =
                (this.entries[parents[0]] as Tree | undefined) || new Tree())

            tree.addEntry(parents.slice(1), entry)
        }
    }

    get type(): 'tree' {
        return 'tree'
    }

    get mode() {
        return Tree.TREE_MODE
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
            const mode = entry.mode.toString(8)
            const buffer = new Packer(Tree.ENTRY_FORMAT).pack([
                `${mode} ${name}`,
                entry.oid!,
            ])
            buffers.push(buffer)
        }

        return Buffer.concat(buffers)
    }
}
