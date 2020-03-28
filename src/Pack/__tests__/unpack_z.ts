import * as util from './unpack_util'

describe("Pack#unpack with format 'Z'", () => {
    util.unpackString('Z')

    it("stops decoding at NULL bytes when passed the '*' modifier", () => {
        util.expectUnpack('Z*Z*Z*Z*', 'a\x00\x00 b \x00c', [
            'a',
            '',
            ' b ',
            'c',
        ])
    })

    it('decodes the number of bytes specified by the count modifier and truncates the decoded string at the first NULL byte', () => {
        util.expectUnpack('Z5Z', 'a\x00 \x00b c', ['a', ' '])
        util.expectUnpack('Z5Z', '\x00a\x00 bc \x00', ['', 'c'])
    })
})
