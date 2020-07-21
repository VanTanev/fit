import { DatabaseObject } from './DatabaseObject'
import { Packer } from 'binary-packer'

export class TreeEntry {
    constructor(readonly filePath: string, readonly oid: string) {}
}

export class Tree extends DatabaseObject {
    static ENTRY_FORMAT = 'Z*H40'
    type: 'tree' = 'tree'
    constructor(private readonly entries: TreeEntry[]) {
        super()
    }

    get buffer(): Buffer {
        let buffers: Buffer[] = []
        for (let entry of this.entries) {
            buffers.push(
                new Packer(Tree.ENTRY_FORMAT).pack([`100644 ${entry.filePath}`, entry.oid]),
            )
        }
        return Buffer.concat(buffers)
    }
}
