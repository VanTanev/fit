import { Storable } from '../Storable'

export class Blob implements Storable {
    public oid?: string
    constructor(private data: Buffer) {}

    get type() {
        return 'blob' as const
    }

    get buffer(): Buffer {
        return this.data
    }
}
