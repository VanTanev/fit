import * as util from './pack_util'

describe('Pack.pack() with format "H"', () => {
    util.arrayPackArguments('H')
    util.arrayPackBasicNonFloat('H')

    it('calls #to_str to convert an Object to a String', () => {
        const obj = {
            toString() {
                return 'a'
            },
        }
        util.expectPack('H', [obj], Buffer.from('a0', 'hex'))
    })

    it('encodes the first character as the most significant nibble when passed no count modifier', () => {
        util.expectPack('H', ['ab'], Buffer.from('a0', 'hex'))
    })

    it("implicitly has count equal to the string length when passed the '*' modifier", () => {
        util.expectPack('H*', ['deadbee'], Buffer.from('deadbee0', 'hex'))
        util.expectPack('H*', ['deadbeef'], Buffer.from('deadbeef', 'hex'))
    })

    it('encodes count nibbles when passed a count modifier exceeding the string length', () => {
        util.expectPack('H2', ['a'], Buffer.from('a0', 'hex'))
        util.expectPack('H8', ['ab'], Buffer.from('ab000000', 'hex'))
    })

    it('encodes the first character as the most significant nibble of a hex value', () => {
        const data: [string[], string][] = [
            [['0'], '00'],
            [['1'], '10'],
            [['2'], '20'],
            [['3'], '30'],
            [['4'], '40'],
            [['5'], '50'],
            [['6'], '60'],
            [['7'], '70'],
            [['8'], '80'],
            [['9'], '90'],
            [['a'], 'a0'],
            [['b'], 'b0'],
            [['c'], 'c0'],
            [['d'], 'd0'],
            [['e'], 'e0'],
            [['f'], 'f0'],
            [['A'], 'a0'],
            [['B'], 'b0'],
            [['C'], 'c0'],
            [['D'], 'd0'],
            [['E'], 'e0'],
            [['F'], 'f0'],
        ]
        data.forEach(([data, result]) => {
            util.expectPack('H2', data, Buffer.from(result, 'hex'))
        })
    })

    it('encodes the second character as the least significant nibble of a hex value', () => {
        const data: [string[], string][] = [
            [['00'], '00'],
            [['01'], '01'],
            [['02'], '02'],
            [['03'], '03'],
            [['04'], '04'],
            [['05'], '05'],
            [['06'], '06'],
            [['07'], '07'],
            [['08'], '08'],
            [['09'], '09'],
            [['0a'], '0a'],
            [['0b'], '0b'],
            [['0c'], '0c'],
            [['0d'], '0d'],
            [['0e'], '0e'],
            [['0f'], '0f'],
            [['0A'], '0a'],
            [['0B'], '0b'],
            [['0C'], '0c'],
            [['0D'], '0d'],
            [['0E'], '0e'],
            [['0F'], '0f'],
        ]
        data.forEach(([data, result]) => {
            util.expectPack('H2', data, Buffer.from(result, 'hex'))
        })
    })

    it.skip('encodes the least significant nibble of a non alphanumeric character as the most significant nibble of the hex value', () => {
        const data: [string[], string][] = [
            [['^'], 'e0'],
            [['*'], 'a0'],
            [['#'], '30'],
            [['['], 'b0'],
            [[']'], 'd0'],
            [['@'], '00'],
            [['!'], '10'],
            [['H'], '10'],
            [['O'], '80'],
            [['T'], 'd0'],
            [['Z'], '30'],
        ]
        data.forEach(([data, result]) => {
            util.expectPack('H2', data, Buffer.from(result, 'hex'))
        })
    })

    it('does not support encodes the least significant nibble of a non alphanumeric character as the most significant nibble of the hex value', () => {
        const data: [string[], string][] = [
            [['^'], 'e0'],
            [['*'], 'a0'],
            [['#'], '30'],
            [['['], 'b0'],
            [[']'], 'd0'],
            [['@'], '00'],
            [['!'], '10'],
            [['H'], '10'],
            [['O'], '80'],
            [['T'], 'd0'],
            [['Z'], '30'],
        ]
        data.forEach(([data, result]) => {
            expect(() =>
                util.expectPack('H2', data, Buffer.from(result, 'hex')),
            ).toThrow('Unsupported HEX string')
        })
    })
})

describe('Pack.pack() with format "h"', () => {
    util.arrayPackArguments('h')
    util.arrayPackBasicNonFloat('h')

    it('calls #to_str to convert an Object to a String', () => {
        const obj = {
            toString() {
                return 'a'
            },
        }
        util.expectPack('h', [obj], Buffer.from('0a', 'hex'))
    })

    it('encodes the first character as the most significant nibble when passed no count modifier', () => {
        util.expectPack('h', ['ab'], Buffer.from('0a', 'hex'))
    })

    it("implicitly has count equal to the string length when passed the '*' modifier", () => {
        util.expectPack('h*', ['deadbee'], Buffer.from('eddaeb0e', 'hex'))
        util.expectPack('h*', ['deadbeef'], Buffer.from('eddaebfe', 'hex'))
    })

    it('encodes count nibbles when passed a count modifier exceeding the string length', () => {
        util.expectPack('h2', ['a'], Buffer.from('0a', 'hex'))
        util.expectPack('h8', ['ab'], Buffer.from('ba000000', 'hex'))
    })

})
