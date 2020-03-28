import { expectUnpack } from './unpack_util'

describe("Pack#unpack with format 'H'", () => {
    it('decodes one nibble from each byte for each format character starting with the most significant bit', () => {
        const data: [string, string, string[]][] = [
            ['\x8f', 'H', ['8']],
            ['\xf8\x0f', 'HH', ['f', '0']],
        ]
        data.forEach(([data, format, expected]) => {
            expectUnpack(format, data, expected)
        })
    })

    it('decodes only the number of nibbles in the string when passed a count', () => {
        expectUnpack('H5', '\xca\xfe', ['cafe'])
    })

    it('decodes multiple differing nibble counts from a single string', () => {
        expectUnpack('HH2H3H4H5', '\xaa\x55\xaa\xd4\xc3\x6b\xd7\xaa\xd7', [
            'a',
            '55',
            'aad',
            'c36b',
            'd7aad',
        ])
    })

    it("decodes a directive with a '*' modifier after a directive with a count modifier", () => {
        expectUnpack('H3H*', '\xaa\x55\xaa\xd4\xc3\x6b', ['aa5', 'aad4c36b'])
    })

    it("decodes a directive with a count modifier after a directive with a '*' modifier", () => {
        expectUnpack('H*H3', '\xaa\x55\xaa\xd4\xc3\x6b', ['aa55aad4c36b', ''])
    })

    it('decodes the number of nibbles specified by the count modifier', () => {
        const data: [string, string, string[]][] = [
            ['\xab', 'H0', ['']],
            ['\x00', 'H1', ['0']],
            ['\x01', 'H2', ['01']],
            ['\x01\x23', 'H3', ['012']],
            ['\x01\x23', 'H4', ['0123']],
            ['\x01\x23\x45', 'H5', ['01234']],
        ]
        data.forEach(([data, format, expected]) => {
            expectUnpack(format, data, expected)
        })
    })

    it("decodes all the nibbles when passed the '*' modifier", () => {
        const data: [string, string[]][] = [
            ['', ['']],
            ['\xab', ['ab']],
            ['\xca\xfe', ['cafe']],
        ]
        data.forEach(([data, expected]) => {
            expectUnpack('H*', data, expected)
        })
    })

    it('adds an empty string for each element requested beyond the end of the String', () => {
        const data: [string, string[]][] = [
            ['', ['', '', '']],
            ['\x01', ['0', '', '']],
            ['\x01\x80', ['0', '8', '']],
        ]
        data.forEach(([data, expected]) => {
            expectUnpack('HHH', data, expected)
        })
    })

    it('ignores NULL bytes between directives', () => {
        expectUnpack('H\x00H', '\x01\x10', ['0', '1'])
    })

    it('ignores spaces between directives', () => {
        expectUnpack('H H', '\x01\x10', ['0', '1'])
    })
})
