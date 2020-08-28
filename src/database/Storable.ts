import { sha1 } from '../util'

export abstract class Storable {
    abstract readonly type: string
    abstract readonly content: Buffer

    private _buffer!: Buffer
    private _oid!: string

    constructor() {}

    get buffer(): Buffer {
        this._buffer =
            this._buffer ??
            Buffer.concat([Buffer.from(`${this.type} ${this.content.byteLength}\0`), this.content])
        return this._buffer
    }

    get oid(): string {
        this._oid = this._oid ?? sha1(this.buffer)
        return this._oid
    }
}
