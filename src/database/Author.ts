export class Author {
    constructor(private name: string = '', private email: string = '', private time = new Date()) {}

    toString() {
        const timestamp = `${Math.round(+this.time / 1000)} +0000`
        return `${this.name} <${this.email}> ${timestamp}`
    }
}
