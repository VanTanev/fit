// vi: ft=typescript

import path from 'path'
import fs from 'fs'

import { resolvePath } from './utils'
import { Workspace }  from './Workspace'
import { Database }  from './Database'
import { Blob }  from './database/Blob'
import { Tree }  from './database/Tree'
import { Commit }  from './database/Commit'
import { Author }  from './database/Author'
import { Refs }  from './Refs'
import { Index }  from './Index'

function main(ARGV: string[]) {
    const command = ARGV.shift()

    switch (command) {
        case 'init': {
            const targetPath = ARGV[0] ?? process.cwd()
            const rootPath = resolvePath(targetPath)
            const gitPath = path.join(rootPath, '.git')

            for (const dir of ['objects', 'refs']) {
                try {
                    fs.mkdirSync(path.join(gitPath, dir), { recursive: true })
                } catch (e) {
                    console.error(`fatal: ${e}`)
                    process.exit(1)
                }
            }

            console.log(`Initialized empty TS-Jit repository in ${gitPath}`)
            process.exit(0)
        }

        case 'commit': {
            const rootPath = resolvePath(process.cwd())
            const gitPath = path.join(rootPath, '.git')
            const dbPath = path.join(gitPath, 'objects')
            const indexPath = path.join(gitPath, 'index')

            const database = new Database(dbPath)
            const index = new Index(indexPath)
            const refs = new Refs(gitPath)

            index.load()

            const root = Tree.build(index.sortedEntries())
            root.traverse(tree => database.store(tree))

            const author = new Author(
                process.env.GIT_AUTHOR_NAME!,
                process.env.GIT_AUTHOR_EMAIL!,
                new Date(),
            )
            const parent = refs.readHead()
            const message = fs.readFileSync(0).toString('utf8')
            const commit = new Commit(parent, root.oid!, author, message)
            database.store(commit)
            refs.updateHead(commit.oid!)

            const isRoot = !parent ? '(root-commit) ' : ''
            console.log(`[${isRoot}${commit.oid}] ${message.split('\n')[0]}`)
            process.exit(0)
        }

        case 'add': {
            const rootPath = resolvePath(process.cwd())
            const gitPath = path.join(rootPath, '.git')
            const dbPath = path.join(gitPath, 'objects')
            const indexPath = path.join(gitPath, 'index')

            const workspace = new Workspace(rootPath)
            const database = new Database(dbPath)
            const index = new Index(indexPath)

            index.loadForUpdate()

            if (!ARGV.length) {
                console.error(`ts-jit: [add] a path is required`)
                process.exit(1)
            }

            for (const input of ARGV) {
                const filePaths = workspace.listFiles(input)

                for (const filePath of filePaths) {
                    const data = workspace.readFile(filePath)
                    const stat = workspace.statFile(filePath)
                    const blob = new Blob(data)
                    database.store(blob)
                    index.addEntry(filePath, blob, stat)
                }
            }

            index.writeUpdates()

            process.exit(0)
        }

        case undefined: {
            console.error(`ts-jit: no help available yet`)
            process.exit(0)
        }

        default: {
            console.error(`ts-jit: ${command} is not a ts-jit command.`)
            process.exit(1)
        }
    }
}

main(process.argv.slice(2))
