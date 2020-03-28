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
export function unpack32bitBe(_format: string) {
    const format = makeFormat(_format)

    it('decodes one int for a single format character', () => {
        expectUnpack(format(), 'dcba', [1684234849])
    })

    it('decodes two ints for two format characters', () => {
        expectUnpack(format(undefined, 2), 'hgbadcfe', [1751605857, 1684235877])
    })

    it('decodes the number of ints requested by the count modifier', () => {
        // N2
        expectUnpack(format(2), 'ecbahgfd', [1701012065, 1751606884])
    })

    it("decodes the remaining ints when passed the '*' modifier", () => {
        expectUnpack(format('*'), 'dbcahfge', [1684169569, 1751541605])
    })

    it("decodes the remaining ints when passed the '*' modifier after another directive", () => {
        expectUnpack(format() + format('*'), 'dcbahgfe', [
            1684234849,
            1751606885,
        ])
    })

    it("throws when fewer bytes than an int remain and the '*' modifier is passed", () => {
        expect(() => {
            expectUnpack(format('*'), 'abc', [])
        }).toThrow('Cannot parse integer')
    })

    it('throws when elements are requested beyond the end of the string', () => {
        expect(() => {
            expectUnpack(format('3'), 'abc', [
                undefined,
                undefined,
                undefined,
            ] as any)
        }).toThrow('Cannot parse integer')
    })

    it('ignores NULL bytes between directives', () => {
        expectUnpack(format('\x00', 2), 'dcbahgfe', [1684234849, 1751606885])
    })

    it('ignores spaces between directives', () => {
        expectUnpack(format(' ', 2), 'dcbahgfe', [1684234849, 1751606885])
    })

    // it("does not decode an int when fewer bytes than an int remain and the '*' modifier is passed", () => {
    //     expectUnpack(format('*'), 'abc', [])
    // })

    // it("adds nil for each element requested beyond the end of the String", () => {
    //   [ ["",          [nil, nil, nil]],
    //     ["dcbae",     [1684234849, nil, nil]],
    //     ["dcbaefg",   [1684234849, nil, nil]],
    //     ["dcbahgfe",  [1684234849, 1751606885, nil]]
    //   ].should be_computed_by(:unpack, unpack_format(3))
    // })
}

export function expectUnpack(
    format: string,
    data: string | Buffer,
    expected: Array<string | number>,
): void {
    const res = makeUnpack(format)(data as any)
    expect(res).toEqual(expected)
}
export function unpack16bitBe(_format: string) {
    const format = makeFormat(_format)
    it('decodes one short for a single format character', () => {
        expectUnpack(format(), 'ba', [25185])
    })

    it('decodes two shorts for two format characters', () => {
        expectUnpack(format(undefined, 2), 'badc', [25185, 25699])
    })

    it('decodes the number of shorts requested by the count modifier', () => {
        expectUnpack(format(3), 'badcfe', [25185, 25699, 26213])
    })

    it("decodes the remaining shorts when passed the '*' modifier", () => {
        expectUnpack(format('*'), 'badc', [25185, 25699])
    })

    it("decodes the remaining shorts when passed the '*' modifier after another directive", () => {
        expectUnpack(format() + format('*'), 'badc', [25185, 25699])
    })

    it('ignores NULL bytes between directives', () => {
        expectUnpack(format('\x00', 2), 'badc', [25185, 25699])
    })

    it('ignores spaces between directives', () => {
        expectUnpack(format(' ', 2), 'badc', [25185, 25699])
    })

    it("throws when fewer bytes than a short remain and the '*' modifier is passed", () => {

        expect(() => {
            expectUnpack(format('*'), '\xff', [])
        }).toThrow('Cannot parse integer')
    })

    // it("does not decode a short when fewer bytes than a short remain and the '*' modifier is passed", () => {
    //   "\xff".unpack(unpack_format('*')).should == []
    // })

    it("throws when fewer bytes than the number of requested integers", () => {

        expect(() => {
            expectUnpack(format('3'), 'badc', [])
        }).toThrow('Cannot parse integer')
    })
}
