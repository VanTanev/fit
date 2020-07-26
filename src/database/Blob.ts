import { Storable } from './Storable'
import * as fs from '../fsUtils'

export class Blob extends Storable {
    type: 'blob' = 'blob'
    constructor(readonly data: Buffer) {
        super()
    }
}

export class FileBlob extends Blob {
    constructor(readonly filePath: string, readonly data: Buffer, readonly stat: fs.Stats) {
        super(data)
    }
}
