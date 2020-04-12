export class Author {
    constructor(
        private name: string = '',
        private email: string = '',
        private time: Date,
    ) {}

    toString() {
        // TODO fix timezone
        const timestamp = `${Math.round(+this.time / 1000)} +0200`
        return `${this.name} <${this.email}> ${timestamp}`
    }
}
