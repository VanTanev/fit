import Pack from '../Pack'

test.todo('this is an utils file')

export function unpackBasic(format: string) {
    it('ignores whitespace in the format string', () => {
        expect(makeUnpack('a \t\n\b\f\r' + format)('abc')).toBeInstanceOf(Array)
    })
}

export function makeUnpack(format: string): Pack['unpack'] {
    const pack = new Pack(format)
    return pack.unpack.bind(pack)
}

export function expectUnpack(
    format: string,
    data: string | Buffer,
    expected: Array<string | number | bigint>,
): void {
    const res = makeUnpack(format)(data as any)
    expect(res).toEqual(expected)
}
