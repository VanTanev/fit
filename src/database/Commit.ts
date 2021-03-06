import { Storable } from './Storable'
import { Author } from './Author'

export class Commit extends Storable {
    constructor(
        readonly parentId: string | undefined,
        readonly treeId: string,
        readonly author: Author,
        readonly message: string,
    ) {
        super()
    }

    type: 'commit' = 'commit'

    get content(): Buffer {
        let lines: string[] = []
        lines.push(`tree ${this.treeId}`)
        if (this.parentId) {
            lines.push(`parent ${this.parentId}`)
        }
        lines.push(`author ${this.author}`)
        lines.push(`committer ${this.author}`)
        lines.push('')
        lines.push(this.message)

        return Buffer.from(lines.join('\n'))
    }
}
