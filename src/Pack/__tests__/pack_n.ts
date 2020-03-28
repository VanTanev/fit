import * as util from './pack_util'

describe('Pack.pack() with "N" format', () => {
    util.arrayPackArguments('N')
    util.arrayPackBasicNonFloat('N')
    util.arrayPackNumericBasic('N')
    util.arrayPack32BitBe('N')

    it('splats', () => {
        util.expectPack(
            'N*',
            [0x0000_0021, 0x0000_4321],
            '\x00\x00\x00\x21' + '\x00\x00\x43\x21',
        )
    })
})

describe('Pack.pack() with "n" format', () => {
    util.arrayPackArguments('n')
    util.arrayPackBasicNonFloat('n')
    util.arrayPackNumericBasic('n')
    util.arrayPack16BitBe('n')
    it('splats', () => {
        util.expectPack('n*', [0x0021, 0x4321], '\x00\x21' + '\x43\x21')
    })
})
