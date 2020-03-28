import * as util from './unpack_util'

describe('Pack.pack() with "N" format', () => {
    util.unpack32bitBe('N')

    it('decodes an int with most significant bit set as a positive number', () => {
        util.expectUnpack('N', '\xff\x00\xaa\x00', [4278233600])
    })
})

describe('Pack.pack() with "n" format', () => {
    util.unpack16bitBe('n')

    it('decodes an int with most significant bit set as a positive number', () => {
        util.expectUnpack('n', '\xff\x00', [65280])
    })
})
