import { Index } from '../Index'
import { Workspace, FileStats } from '../Workspace'
import path from 'path'
import crypto from 'crypto'

describe(Index, () => {
    let subject: Index
    let stat: FileStats
    let oid: string
    beforeEach(() => {
        const tmpPath = path.resolve('../tmp')
        const indexPath = path.join(tmpPath, 'index')
        subject = new Index(indexPath)

        stat = Workspace.statFile(__filename)

        const buff = Buffer.allocUnsafe(20)
        crypto.randomFillSync(buff)
        oid = buff.toString('hex')
    })

    it('adds a single file', () => {
        subject.addEntry('alice.txt', oid, stat)
        expect(subject.sortedEntries().map(e => e.path)).toEqual(['alice.txt'])
    })

    it('replaces a file with a directory', () => {
        subject.addEntry('alice.txt', oid, stat)
        subject.addEntry('bob.txt', oid, stat)

        subject.addEntry('alice.txt/nested.txt', oid, stat)

        expect(subject.sortedEntries().map(e => e.path)).toEqual([
            'alice.txt/nested.txt',
            'bob.txt',
        ])
    })

    it("replaces a directory with a file", () => {
        subject.addEntry('alice.txt', oid, stat)
        subject.addEntry('nested/bob.txt', oid, stat)
        subject.addEntry("nested/inner/claire.txt", oid, stat)

        subject.addEntry('nested', oid, stat)

        expect(subject.sortedEntries().map(e => e.path)).toEqual([
            'alice.txt',
            'nested',
        ])
    })
})
