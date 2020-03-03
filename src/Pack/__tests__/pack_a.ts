import * as util from './pack_util'

describe('Pack.pack() with format "A"', () => {
    util.arrayPackArguments('A')
    util.arrayPackBasicNonFloat('A')
    util.arrayPackString('A')

    it("adds all the bytes to the output when passed the '*' modifier", () => {
        util.expectPack('A*', ['abc'], 'abc')
    })

    it('padds the output with spaces when the count exceeds the size of the String', () => {
        util.expectPack('A6', ['abc'], 'abc   ')
    })

    it('adds a space when the value is nil', () => {
        util.expectPack('A', [null], ' ')
        util.expectPack('A', [undefined], ' ')
    })

    it('pads the output with spaces when the value is nil', () => {
        util.expectPack('A3', [null], '   ')
        util.expectPack('A3', [undefined], '   ')
    })

    it("does not pad with spaces when passed the '*' modifier and the value is nil", () => {
        util.expectPack('A*', [null], '')
        util.expectPack('A*', [undefined], '')
    })
})

describe('Pack.pack() with format "a"', () => {
    util.arrayPackArguments('a')
    util.arrayPackBasicNonFloat('a')
    util.arrayPackString('a')

    it("adds all the bytes to the output when passed the '*' modifier", () => {
        util.expectPack('a*', ['abc'], 'abc')
    })

    it('padds the output with spaces when the count exceeds the size of the String', () => {
        util.expectPack('a6', ['abc'], 'abc\0\0\0')
    })

    it('adds a space when the value is nil', () => {
        util.expectPack('a', [null], '\0')
        util.expectPack('a', [undefined], '\0')
    })

    it('pads the output with spaces when the value is nil', () => {
        util.expectPack('a3', [null], '\0\0\0')
        util.expectPack('a3', [undefined], '\0\0\0')
    })

    it("does not pad with spaces when passed the '*' modifier and the value is nil", () => {
        util.expectPack('a*', [null], '')
        util.expectPack('A*', [undefined], '')
    })
})
