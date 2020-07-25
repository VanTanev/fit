import { sha1 } from '../util'
export abstract class DatabaseObject {
    abstract readonly type: string
    abstract readonly data: Buffer

    private _buffer!: Buffer
    private _oid!: string

    constructor() {}

    get buffer(): Buffer {
        this._buffer =
            this._buffer ??
            Buffer.concat([Buffer.from(`${this.type} ${this.data.byteLength}\0`), this.data])
        return this._buffer
    }

    get oid(): string {
        this._oid = this._oid ?? sha1(this.buffer)
        return this._oid
    }
}
