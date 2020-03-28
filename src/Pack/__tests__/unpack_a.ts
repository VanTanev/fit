import * as util from './unpack_util'

describe("Pack#unpack with format 'A'", () => {
    util.unpackString('A')
    util.unpackAa('A')

    function test(data: [string, string[]][], _format: string) {
        data.forEach(([data, expected]) => {
            util.expectUnpack(_format, data, expected)
        })
    }

    it('removes trailing space and NULL bytes from the decoded string', () => {
        test(
            [
                ['a\x00 b \x00', ['a\x00 b', '']],
                ['a\x00 b \x00 ', ['a\x00 b', '']],
                ['a\x00 b\x00 ', ['a\x00 b', '']],
                ['a\x00 b\x00', ['a\x00 b', '']],
                ['a\x00 b ', ['a\x00 b', '']],
            ],
            'A*A',
        )
    })

    it('does not remove whitespace other than space', () => {
        test(
            [
                ['a\x00 b\x00\f', ['a\x00 b\x00\f']],
                ['a\x00 b\x00\n', ['a\x00 b\x00\n']],
                ['a\x00 b\x00\r', ['a\x00 b\x00\r']],
                ['a\x00 b\x00\t', ['a\x00 b\x00\t']],
                ['a\x00 b\x00\v', ['a\x00 b\x00\v']],
            ],
            'A*',
        )
    })
})

describe("Pack#unpack with format 'a'", () => {
    util.unpackString('a')
    util.unpackAa('a')

    function test(data: [string, string[]][], _format: string) {
        data.forEach(([data, expected]) => {
            util.expectUnpack(_format, data, expected)
        })
    }

    it('does not remove trailing whitespace or NULL bytes from the decoded string', () => {
        test(
            [
                ['a\x00 b \x00', ['a\x00 b \x00']],
                ['a\x00 b \x00 ', ['a\x00 b \x00 ']],
                ['a\x00 b\x00 ', ['a\x00 b\x00 ']],
                ['a\x00 b\x00', ['a\x00 b\x00']],
                ['a\x00 b ', ['a\x00 b ']],
                ['a\x00 b\f', ['a\x00 b\f']],
                ['a\x00 b\n', ['a\x00 b\n']],
                ['a\x00 b\r', ['a\x00 b\r']],
                ['a\x00 b\t', ['a\x00 b\t']],
                ['a\x00 b\v', ['a\x00 b\v']],
            ],
            'a*',
        )
    })
})
