import { TokenType, FormatTokenizer, Token } from './Tokenizer'

// TODO: Figure out how is this defined?
// console.log({length})

export default class Pack {
    private tokens: Token[]
    private index = -1

    constructor(public format: string) {
        this.tokens = new FormatTokenizer(format).tokenize()
    }

    pack(data: Array<string | number | bigint>): Buffer {
        const buffers: Buffer[] = []
        let i = -1
        while (++i < data.length) {
            // console.log({
            //     format: this.format,
            //     tokens: this.tokens.slice(this.index + 1),
            //     data,
            //     curData: data[i],
            //     i,
            //     buffers,
            // })
            const { value: type } = this.consumeToken('type')
            let length = 1
            let sData = String(data[i] ?? '')

            while (this.peekToken('whitespace')) {
                this.consumeToken('whitespace')
            }

            if (this.peekToken('modifier_length')) {
                length = Number(this.consumeToken('modifier_length').value)
            }

            if (this.peekToken('modifier_splat')) {
                this.consumeToken('modifier_splat')
                length = sData.length
                if (type === 'Z') {
                    length++
                }
            }

            switch (type) {
                case 'a':
                case 'Z':
                case 'A': {
                    let buff = Buffer.alloc(length)
                    sData = sData.padEnd(
                        length,
                        type === 'a' || type === 'Z' ? '\0' : ' ',
                    )
                    buff.write(sData, 'utf8')

                    buffers.push(buff)
                    break
                }

                case 'H': {
                    if (!/^[0-9a-fA-F]+$/.test(sData)) {
                        throw Error(`Unsupported HEX string "${sData}"`)
                    }
                    const len = Math.ceil(length / 2)
                    const buff = Buffer.alloc(len)
                    if (length === 1) {
                        sData = sData.substring(0, 1).padEnd(2, '0')
                    } else {
                        sData = sData.padEnd(len * 2, '0')
                    }

                    buff.write(sData, 'hex')

                    buffers.push(buff)
                    break
                }

                case 'h': {
                    if (!/^[0-9a-fA-F]+$/.test(sData)) {
                        throw Error(`Unsupported HEX string "${sData}"`)
                    }
                    const len = Math.ceil(length / 2)
                    const buff = Buffer.alloc(len)
                    if (length === 1) {
                        sData = sData.substring(0, 1).padEnd(2, '0')
                    } else {
                        sData = sData.padEnd(len * 2, '0')
                    }

                    buff.write(sData, 'hex')
                    for (let i = 0; i < len; i++) {
                        let v = buff.readUInt8(i)
                        v = (v >> 4) | ((v << 4) & 0xff)
                        buff.writeUInt8(v, i)
                    }

                    buffers.push(buff)
                    break
                }

                case 'n': {
                    const res = packIntegers({
                        data: data as number[],
                        i,
                        length,
                        size: 16,
                    })
                    i = res.i
                    buffers.push(res.buffer)
                    break
                }
                case 'N': {
                    const res = packIntegers({
                        data: data as number[],
                        i,
                        length,
                        size: 32,
                    })
                    i = res.i

                    buffers.push(res.buffer)
                    break
                }

                default: {
                    throw new Error(`Cannot unpack type "${type}"`)
                }
            }
        }

        this.ensureAllTokensConsumed()
        return Buffer.concat(buffers)
    }

    /**
     * @param input A Buffer to unpack
     */
    unpack(input: Buffer): Array<string | number>
    /**
     * @param input The string to unpack
     * @param encoding The encoding of the string, defaults to "binary"
     */
    unpack(input: string, encoding?: BufferEncoding): Array<string | number>
    unpack(
        input: Buffer | string,
        encoding: BufferEncoding = 'binary',
    ): Array<string | number> {
        input = Buffer.isBuffer(input) ? input : Buffer.from(input, encoding)

        const res: Array<string | number> = []
        while (this.peekToken('type')) {
            const { value: type } = this.consumeToken('type')

            while (this.peekToken('whitespace')) {
                this.consumeToken('whitespace')
            }

            let length = 1

            if (this.peekToken('modifier_length')) {
                length = Number(this.consumeToken('modifier_length').value)
            }

            if (this.peekToken('modifier_splat')) {
                this.consumeToken('modifier_splat')
                length = -1
            }

            switch (type) {
                case 'H': {
                    const len =
                        length === -1 ? input.length : Math.ceil(length / 2)
                    const buf = input.subarray(0, len)
                    input = input.subarray(len)
                    // console.log({ buf, len, input: Buffer.concat([buf, input]), rest: input })
                    res.push(
                        buf
                            .toString('hex')
                            .substring(0, length === -1 ? undefined : length),
                    )
                }
            }
        }

        this.ensureAllTokensConsumed()
        return res
    }

    private consumeToken(type: TokenType): Token {
        const token = this.tokens[++this.index]
        if (!token || (type && token.type !== type)) {
            throw new Error(
                `Could not consume token of type "${type}", token was: ${token}`,
            )
        }
        return token
    }

    private peekToken(type: TokenType): boolean {
        const token = this.tokens[this.index + 1]
        if (!token) {
            return false
        }
        return token.type === type
    }

    private ensureAllTokensConsumed() {
        const index = this.index
        this.index = -1
        if (index !== this.tokens.length - 1) {
            throw new Error(
                `ArgumentError: There are fewer elements in the given data than the format requires`,
            )
        }
    }
}

function packIntegers({
    data,
    i,
    length,
    size,
}: {
    data: number[]
    i: number
    length: number
    size: 16 | 32
}): { buffer: Buffer; i: number } {
    const numBuffers: Buffer[] = []
    while (length-- > 0) {
        const buff = Buffer.alloc(size / 8)
        let num = data[i++]
        if (size === 32) {
            num =
                typeof num === 'bigint'
                    ? Number(BigInt.asUintN(size, num))
                    : num
            buff.writeUInt32BE(num, 0)
        } else {
            num =
                typeof num === 'bigint'
                    ? Number(BigInt.asUintN(size, num))
                    : num
            buff.writeUInt16BE(num, 0)
        }
        numBuffers.push(buff)
    }
    return { buffer: Buffer.concat(numBuffers), i: i - 1 }
}
