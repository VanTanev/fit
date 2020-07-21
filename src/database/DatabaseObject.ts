import { sha1} from '../util'
export abstract class DatabaseObject {
    abstract readonly type: string
    abstract readonly buffer: Buffer

    private _content!: Buffer
    private _oid!: string

    constructor() {}

    get content(): Buffer {
        this._content =
            this._content ??
            Buffer.concat([Buffer.from(`${this.type} ${this.buffer.byteLength}\0`), this.buffer])
        return this._content
    }

    get oid(): string {
        this._oid = this._oid ?? sha1(this.content)
        return this._oid
    }
}
