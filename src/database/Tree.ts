import { DatabaseObject } from './DatabaseObject'
import { Packer } from 'binary-packer'
import * as fs from '../fsUtils'

export class TreeEntry {
    constructor(readonly filePath: string, readonly oid: string, readonly stat: fs.Stats) {}

    get mode() {
        return this.stat.userMode
    }
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
                new Packer(Tree.ENTRY_FORMAT).pack([`${entry.mode} ${entry.filePath}`, entry.oid]),
            )
        }
        return Buffer.concat(buffers)
    }
}
