import { Author} from './Author'
import { Storable } from '../Storable'

export class Commit implements Storable {
    public oid?: string
    constructor(
        public parent: string | undefined,
        public treeId: string,
        public author: Author,
        public message: string,
    ) {}

    get type(): string {
        return 'commit' as const
    }

    get buffer(): Buffer {
        const lines: string[] = []

        lines.push(`tree ${this.treeId}`)
        if (this.parent) {
            lines.push(`parent ${this.parent}`)
        }
        lines.push(`author ${this.author}`)
        lines.push(`committer ${this.author}`)
        lines.push('')
        lines.push(this.message)

        return Buffer.from(lines.join('\n'))
    }
}
