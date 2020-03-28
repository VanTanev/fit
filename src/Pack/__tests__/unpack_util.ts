import Pack from '../Pack'
import { makeFormat } from './pack_util'

test.todo('this is an utils file')

export function makeUnpack(format: string): Pack['unpack'] {
    const pack = new Pack(format)
    return pack.unpack.bind(pack)
}

export function unpackString(_format: string) {
    const format = makeFormat(_format)

    it('returns an empty string if the input is empty', () => {
        expectUnpack(format(), '', [''])
    })

    it('returns empty strings for repeated formats if the input is empty', () => {
        expectUnpack(format(undefined, 3), '', ['', '', ''])
    })

    it('returns an empty string and does not decode any bytes when the count modifier is zero', () => {
        expectUnpack(format(0) + format(), 'abc', ['', 'a'])
    })

    it('implicitly has a count of one when no count is specified', () => {
        expectUnpack(format(), 'abc', ['a'])
    })

    it('decodes the number of bytes specified by the count modifier', () => {
        expectUnpack(format(3), 'abc', ['abc'])
    })

    function test(data: [string, string[]][], _format = format()) {
        data.forEach(([data, expected]) => {
            expectUnpack(_format, data, expected)
        })
    }

    it('decodes the number of bytes specified by the count modifier including whitespace bytes', () => {
        test(
            [
                ['a bc', ['a b', 'c']],
                ['a\fbc', ['a\fb', 'c']],
                ['a\nbc', ['a\nb', 'c']],
                ['a\rbc', ['a\rb', 'c']],
                ['a\tbc', ['a\tb', 'c']],
                ['a\vbc', ['a\vb', 'c']],
            ],
            format(3) + format(),
        )
    })

    it("decodes past whitespace bytes when passed the '*' modifier", () => {
        test(
            [
                ['a b c', ['a b c']],
                ['a\fb c', ['a\fb c']],
                ['a\nb c', ['a\nb c']],
                ['a\rb c', ['a\rb c']],
                ['a\tb c', ['a\tb c']],
                ['a\vb c', ['a\vb c']],
            ],
            format('*'),
        )
    })
}

export function unpackAa(_format: string) {
    const format = makeFormat(_format)

    it('decodes the number of bytes specified by the count modifier including NULL bytes', () => {
        expectUnpack(format(3) + format(), 'a\x00bc', ['a\x00b', 'c'])
    })

    it("decodes past NULL bytes when passed the '*' modifier", () => {
        expectUnpack(format('*'), 'a\x00b c', ['a\x00b c'])
    })
}

export function expectUnpack(
    format: string,
    data: string | Buffer,
    expected: Array<string | number>,
): void {
    const res = makeUnpack(format)(data as any)
    expect(res).toEqual(expected)
}
