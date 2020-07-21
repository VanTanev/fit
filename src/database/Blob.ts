import { DatabaseObject} from './DatabaseObject'

export type FileBlob = {
    path: string
    blob: Blob
}

export function fileBlob(path: string, blob: Blob): FileBlob {
    return { path, blob }
}

export class Blob extends DatabaseObject {
    type: 'blob' = 'blob'
    constructor(readonly buffer: Buffer) {
        super()
    }
}

