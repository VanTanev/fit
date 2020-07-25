
import { DatabaseObject} from './DatabaseObject'
import * as fs from '../fsUtils'

export type FileBlob = {
    path: string
    blob: Blob
    stat: fs.Stats
}

export function fileBlob(path: string, buf: Buffer, stat: fs.Stats): FileBlob {
    return { path, blob: new Blob(buf), stat }
}

export class Blob extends DatabaseObject {
    type: 'blob' = 'blob'
    constructor(readonly data: Buffer) {
        super()
    }
}

