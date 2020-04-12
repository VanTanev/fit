import path from 'path'
import crypto from 'crypto'
import fs from 'fs'

import { sha1, deflate, fileExists } from './utils'

export class Database {
    constructor(private path: string) {}

    store(object: Storable) {
        const buffer = object.buffer
        const content = Buffer.concat([
            Buffer.from(`${object.type} ${buffer.byteLength}\0`),
            buffer,
        ])
        object.oid = sha1(content)
        this.writeObject(object.oid, content)
    }

    private writeObject(oid: string, content: Buffer) {
        const objectPath = path.join(
            this.path,
            oid.substring(0, 2),
            oid.substring(2),
        )
        if (fileExists(objectPath)) return

        const dirname = path.dirname(objectPath)
        const tempPath = path.join(
            dirname,
            'tmp_object_' + crypto.randomBytes(10).toString('hex'),
        )

        let file: number
        try {
            file = fs.openSync(tempPath, 'wx+')
        } catch (e) {
            if (e.code !== 'ENOENT') {
                throw e
            }
            fs.mkdirSync(dirname)
            file = fs.openSync(tempPath, 'wx+')
        }

        fs.writeFileSync(file, deflate(content))
        fs.closeSync(file)

        fs.renameSync(tempPath, objectPath)
    }
}
