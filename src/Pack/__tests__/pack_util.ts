import Pack from '../Pack'

test.todo('this is an utils file')

export function arrayPackArguments(_format: string) {
    it('raises an ArgumentError if there are fewer elements than the format requires', () => {
        expect(() => makePack('Z')([])).toThrow()
    })
}
export function arrayPackBasicNonFloat(format: string) {
    const v = '1'

    it('ignores whitespace in the format string', () => {
        const subject = makePack('a \t\n\v\f\r' + format)
        expect(subject([v, v])).toBeInstanceOf(Buffer)
    })
}

export function arrayPackHex(_format: string) {
    const format = makeFormat(_format)

    it('encodes no bytes when passed zero as the count modifier', () => {
        expectPack(format(0), ['1'], '')
    })
}
export function arrayPackString(_format: string) {
    const format = makeFormat(_format)
    it('adds count bytes of a String to the output', () => {
        expectPack(format(2), ['abc'], 'ab')
    })

    it('implicitly has a count of one when no count is specified', () => {
        expectPack(format(), ['abc'], 'a')
    })

    it('does not add any bytes when the count is zero', () => {
        expectPack(format(0), ['abc'], '')
    })

    it('is not affected by a previous count modifier', () => {
        expectPack(format(3) + format(), ['abce', 'defg'], 'abcd')
    })

    it('raises an ArgumentError when the Array is empty', () => {
        expect(() => makePack(format())([])).toThrow('ArgumentError')
    })

    it('raises an ArgumentError when the Array has too few elements', () => {
        expect(() => makePack(format(undefined, 2))(['a'])).toThrow(
            'ArgumentError',
        )
    })

    it('calls #to_str to convert the element to a String', () => {
        const obj = {
            toString() {
                return 'abc'
            },
        }
        expectPack(format(), [obj], 'a')
    })
}

export function arrayPackNumericBasic(_format: string) {
    const format = makeFormat(_format)

    it('returns an empty String if count is zero', () => {
        expectPack(format(0), [1], '')
    })
}

export function arrayPack32BitBe(_format: string) {
    const format = makeFormat(_format)

    function test(data: [[number], string][]) {
        data.forEach(([data, expected]) => {
            expectPack(format(), data, Buffer.from(expected, 'binary'))
        })
    }

    it('encodes the least significant 32 bits of a positive number', () => {
        test([
            [[0x0000_0021], '\x00\x00\x00\x21'],
            [[0x0000_4321], '\x00\x00\x43\x21'],
            [[0x0065_4321], '\x00\x65\x43\x21'],
            [[0x7865_4321], '\x78\x65\x43\x21'],
        ])
    })

    it('throws when given out of range number', () => {
        expect(() => {
            makePack(format())([0x0001_0000_0000])
        }).toThrow('Cannot pack value')

        expect(() => {
            makePack(format())([-1])
        }).toThrow('Cannot pack value')
    })

    it('encodes a Float truncated as an Integer', () => {
        test([
            [[2019902241.2], '\x78\x65\x43\x21'],
            [[2019902241.8], '\x78\x65\x43\x21'],
        ])
    })

    it('encodes the number of array elements specified by the count modifier', () => {
        expectPack(
            format(2),
            [0x1243_6578, 0xdef0_abcd, 0x7865_4321],
            Buffer.from('\x12\x43\x65\x78\xde\xf0\xab\xcd', 'binary'),
        )
    })

    it("encodes all remaining elements when passed the '*' modifier", () => {
        expectPack(
            format('*'),
            [0x1243_6578, 0xdef0_abcd, 0x7865_4321],
            Buffer.from(
                '\x12\x43\x65\x78\xde\xf0\xab\xcd\x78\x65\x43\x21',
                'binary',
            ),
        )
    })

    it('ignores NULL bytes between directives', () => {
        expectPack(
            format('\x00', 2),
            [0x1243_6578, 0xdef0_abcd],
            Buffer.from('\x12\x43\x65\x78\xde\xf0\xab\xcd', 'binary'),
        )
    })

    it("ignores spaces between directives", () => {
        expectPack(
            format(' ' , 2),
            [0x1243_6578, 0xdef0_abcd],
            Buffer.from('\x12\x43\x65\x78\xde\xf0\xab\xcd', 'binary'),
        )
    })
}
export function arrayPack16BitBe(_format: string) {
    const format = makeFormat(_format)

    function test(data: [[number], string][]) {
        data.forEach(([data, expected]) => {
            expectPack(format(), data, Buffer.from(expected, 'binary'))
        })
    }

    it('encodes the least significant 16 bits of a positive number', () => {
        test([
            [[0x0000_0021], '\x00\x21'],
            [[0x0000_4321], '\x43\x21'],
        ])
    })

    it('throws when given out of range number', () => {
        expect(() => {
            makePack(format())([0x0001_0000])
        }).toThrow('Cannot pack value')

        expect(() => {
            makePack(format())([-1])
        }).toThrow('Cannot pack value')
    })

    it('encodes a Float truncated as an Integer', () => {
        test([
            [[0.2], '\x00\x00'],
            [[0.8], '\x00\x00'],
            [[1.8], '\x00\x01'],
        ])
    })

    it('encodes the number of array elements specified by the count modifier', () => {
        expectPack(
            format(2),
            [0x6578, 0xabcd, 0x4321],
            Buffer.from('\x65\x78\xab\xcd', 'binary'),
        )
    })

    it("encodes all remaining elements when passed the '*' modifier", () => {
        expectPack(
            format('*'),
            [0x6578, 0xabcd, 0x4321],
            Buffer.from('\x65\x78\xab\xcd\x43\x21', 'binary'),
        )
    })

    it("ignores NULL bytes between directives", () => {
        expectPack(
            format('\0', 2),
            [0x6578, 0xabcd, 0x4321],
            Buffer.from('\x65\x78\xab\xcd', 'binary'),
        )
    })

    it("ignores spaces between directives", () => {
        expectPack(
            format(' ', 2),
            [0x6578, 0xabcd, 0x4321],
            Buffer.from('\x65\x78\xab\xcd', 'binary'),
        )
    })
}

export function makePack(format: string): Pack['pack'] {
    const pack = new Pack(format)
    return pack.pack.bind(pack)
}

export function expectPack(
    format: string,
    data: any[],
    expected: string | Buffer,
): void {
    expect(makePack(format)(data)).toEqual(
        Buffer.isBuffer(expected) ? expected : Buffer.from(expected),
    )
}

export const makeFormat = (format: string) => (
    count?: number | string,
    repeat?: number,
): string => {
    let res = format
    res += String(count ?? '')
    res = res.repeat(repeat ?? 1)
    return res
}
