import Pack from '../Pack'

test.todo('fudge jest')

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
    function format(count?: number): string {
        return _format + String(count ?? '')
    }
    it('encodes no bytes when passed zero as the count modifier', () => {
        expectPack(format(0), ['1'], '')
    })

    // it('raises a TypeError if the object does not respond to #to_str', () => {
    //     expect(() => {
    //         expectPack(format(0), [{}], '')
    //     })
    // })

    // it('raises a TypeError if #to_str does not return a String', () => {
    //     // obj = mock("pack hex non-string")
    //     // obj.should_receive(:to_str).and_return(1)
    //     // -> { [obj].pack(pack_format) }.should raise_error(TypeError)
    // })
}
export function arrayPackString(_format: string) {
    function format(count?: number, repeat?: number): string {
        let res = _format
        res += String(count ?? '')
        res = res.repeat(repeat ?? 1)
        return res
    }
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

    it.todo('returns a string in encoding of common to the concatenated results')
    // f = pack_format("*")
    // [ [["\u{3042 3044 3046 3048}", 0x2000B].pack(f+"U"),       Encoding::BINARY],
    //   [["abcde\xd1", "\xFF\xFe\x81\x82"].pack(f+"u"),          Encoding::BINARY],
    //   [["a".force_encoding("ascii"), "\xFF\xFe\x81\x82"].pack(f+"u"), Encoding::BINARY],
    //   # under discussion [ruby-dev:37294]
    //   [["\u{3042 3044 3046 3048}", 1].pack(f+"N"),             Encoding::BINARY]
    // ].should be_computed_by(:encoding)
}

export function makePack(format: string) {
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
