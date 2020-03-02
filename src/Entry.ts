import { FileStats } from './Workspace'

export type Mode = typeof Entry.READ_MODE | typeof Entry.EXEC_MODE

export default class Entry {
    static READ_MODE = '100644' as const
    static EXEC_MODE = '100755' as const
    static DIR_MODE =  '40000'

    constructor(
        public path: string,
        public oid: string,
        public stat: FileStats,
    ) {}

    get mode(): Mode {
        return this.stat.user_mode
    }
}
