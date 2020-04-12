import { SortedSet } from '../utils'
describe(SortedSet, () => {
    const s = new SortedSet(['b', 'b', 'a', 'c'])

    test('iterator sorts', () => {
        expect(Array.from(s)).toEqual(['a', 'b', 'c'])
        expect([...s]).toEqual(['a', 'b', 'c'])
    })

    test('entries sorts', () => {
        expect(Array.from(s.entries())).toEqual([
            ['a', 'a'],
            ['b', 'b'],
            ['c', 'c'],
        ])
    })

    test('values sorsts', () => {
        expect(Array.from(s.values())).toEqual(['a', 'b', 'c'])
    })

    test('forEach', () => {
        const res: string[] = []
        s.forEach(v => res.push(v))

        expect(res).toEqual(['a', 'b', 'c'])
    })
})
