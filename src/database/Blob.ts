import { Storable } from './Storable'
import * as fs from '../fs'

export class Blob extends Storable {
    type: 'blob' = 'blob'
    constructor(readonly content: Buffer) {
        super()
    }
}

export class FileBlob extends Blob {
    constructor(readonly filePath: string, readonly content: Buffer, readonly stat: fs.Stats) {
        super(content)
    }
}
