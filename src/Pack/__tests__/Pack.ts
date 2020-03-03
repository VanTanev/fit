import Pack from '../Pack'

describe(Pack, () => {
    describe('A/a', () => {
        it('handles no length', () => {
            const subject = new Pack('A')
            expect(subject.pack(['1'])).toEqual(Buffer.from('1'))
        })

        it('can run multiple times', () => {
            const subject = new Pack('A')
            expect(() => {
                subject.pack(['1'])
                subject.pack(['1'])
            }).not.toThrow()
        })

        it('handles length', () => {
            const subject = new Pack('A3')
            expect(subject.pack(['1'])).toEqual(Buffer.from('1  '))
        })

        it('handles length', () => {
            const subject = new Pack('a3')
            expect(subject.pack(['1'])).toEqual(Buffer.from('1\0\0'))
        })

        it('handles multi-char length', () => {
            const subject = new Pack('A10')
            expect(subject.pack(['1'])).toEqual(Buffer.from('1         '))
        })

        it('handles multi pack', () => {
            const subject = new Pack('AA2A')
            expect(subject.pack(['1', '22222', ''])).toEqual(
                Buffer.from('122 '),
            )
        })
    })

    describe('H', () => {
        it('handles hexes', () => {
            const subject = new Pack('H40')
            expect(
                subject.pack(['3e3df8f7d7c872f4e9bf20c73fcd0879daeaed09']),
            ).toEqual(
                Buffer.from('3e3df8f7d7c872f4e9bf20c73fcd0879daeaed09', 'hex'),
            )
        })
    })

    describe('Z*', () => {
        const subject = new Pack('Z*')
        it('handles arbitrary strings', () => {
            expect(subject.pack(['abc'])).toEqual(Buffer.from('abc\0'))
        })
    })

    describe('A7Z*H40', () => {
        const subject = new Pack('A7Z*H40')
        it('works', () => {
            expect(
                subject.pack([
                    '100644',
                    'example.txt',
                    '3e3df8f7d7c872f4e9bf20c73fcd0879daeaed09',
                ]),
            ).toEqual(
                Buffer.concat([
                    Buffer.from(`100644 example.txt\0`),
                    Buffer.from(
                        '3e3df8f7d7c872f4e9bf20c73fcd0879daeaed09',
                        'hex',
                    ),
                ]),
            )
        })
    })

    describe('N', () => {
        const subject = new Pack('N')
        it('works', () => {
            const res = Buffer.alloc(4)
            res.writeUInt32BE(1, 0)

            expect(subject.pack([1])).toEqual(res)
        })

        it('works with bigint', () => {
            const res = Buffer.alloc(4)
            res.writeUInt32BE(1, 0)

            expect(subject.pack([BigInt(1)])).toEqual(res)
        })

        it('works on multi N', () => {
            const subject = new Pack('N2')
            const res = Buffer.alloc(8)
            res.writeUInt32BE(1, 0)
            res.writeUInt32BE(2, 4)

            expect(subject.pack([1, 2])).toEqual(res)
        })

        it('works on multi N + Z', () => {
            const subject = new Pack('N2Z*')
            const res = Buffer.alloc(8)
            res.writeUInt32BE(1, 0)
            res.writeUInt32BE(2, 4)

            expect(subject.pack([1, 2, 'abc'])).toEqual(
                Buffer.concat([res, Buffer.from('abc\0')]),
            )
        })
    })

    describe('n', () => {
        const subject = new Pack('n')
        it('works', () => {
            const res = Buffer.alloc(2)
            res.writeUInt16BE(1, 0)

            expect(subject.pack([1])).toEqual(res)
        })

        it('works with bigint', () => {
            const res = Buffer.alloc(2)
            res.writeUInt16BE(1, 0)

            expect(subject.pack([BigInt(1)])).toEqual(res)
        })

        it('works on multi n', () => {
            const subject = new Pack('n2')
            const res = Buffer.alloc(4)
            res.writeUInt16BE(1, 0)
            res.writeUInt16BE(2, 2)

            expect(subject.pack([1, 2])).toEqual(res)
        })
    })
})
