import * as util from './pack_util'

describe('Pack.pack() with "N" format', () => {
    util.arrayPackArguments('N')
    util.arrayPackBasicNonFloat('N')
    util.arrayPackNumericBasic('N')
    util.arrayPack32BitBe('N')
})

describe('Pack.pack() with "n" format', () => {
    util.arrayPackArguments('n')
    util.arrayPackBasicNonFloat('n')
    util.arrayPackNumericBasic('n')
    util.arrayPack16BitBe('n')
})
