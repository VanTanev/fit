export type TokenType = typeof TOKEN_TYPES[number][0]

const TOKEN_TYPES = [
    ['type', /A|a|H|h|Z|N|n/],
    ['modifier_length', /\d+/],
    ['modifier_splat', /\*/],
    ['whitespace', /\W+/],
] as const

export class FormatTokenizer {
    constructor(private format: string) {}

    tokenize() {
        const tokens: Token[] = []
        while (this.format.length !== 0) {
            tokens.push(this.tokenizeOne())
        }
        return tokens
    }

    private tokenizeOne(): Token {
        for (let [type, re] of TOKEN_TYPES) {
            re = new RegExp(`^(${re.source})`)
            const match = re.exec(this.format)
            if (match && typeof match[1] !== 'undefined') {
                const value = match[1]
                this.format = this.format.substring(value.length)
                return new Token(type, value)
            }
        }

        throw new Error(`Tokenizer: Could not match token on "${this.format}"`)
    }
}

export class Token {
    constructor(
        public readonly type: TokenType,
        public readonly value: string,
    ) {}

    toString() {
        return JSON.stringify(this)
    }
}
