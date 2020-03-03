import * as util from './pack_util'

describe('Pack.pack() with format "Z"', () => {
    util.arrayPackArguments('Z')
    util.arrayPackBasicNonFloat('Z')
    util.arrayPackString('Z')

    it("adds all the bytes to the output when passed the '*' modifier", () => {
        const subject = util.makePack('Z*')
        expect(subject(['abc'])).toEqual(Buffer.from('abc\0'))
    })
})

