#!/usr/bin/env node

import {confirm, input, select} from '@inquirer/prompts'
import fs from 'fs-extra'
import open from "open"
import {exec} from 'child_process'

import {fileURLToPath} from 'url'
import path from 'path'

const [, , command] = process.argv

if (command !== 'new') {
    console.log('Unknown command. Do you mean "druid new" ?')
    process.exit(1)
}

process.on('uncaughtException', (error) => {
    if (error.name === 'ExitPromptError') {
        console.log('👋 until next time!');
    } else {
        throw error;
    }
});

const laravelVersion = await select({
    message: 'Which version of Laravel do you want to use?',
    choices: [
        {
            name: '12',
            value: '12',
        },
        {
            name: '11',
            value: '11',
        },
    ]
})

const phpVersion = await select({
    message: 'Which version of PHP do you want to use?',
    choices: [
        {
            name: '8.4',
            value: '8.4',
        },
        {
            name: '8.3',
            value: '8.3',
        },
        {
            name: '8.2',
            value: '8.2',
        },
    ]
})

const directoryName = await input({message: 'Enter the project path'})
const currentDir = process.cwd()

const newDirectory = path.join(currentDir, directoryName)
await fs.ensureDir(newDirectory)

const currentScriptFilePath = fileURLToPath(import.meta.url)
const distDirectory = path.dirname(currentScriptFilePath)

const laravelInstallCommand = `composer create-project --prefer-dist laravel/laravel ${newDirectory} ${laravelVersion}`

await execLaravelInstallCommand(laravelInstallCommand)
await copyStubs()
await replaceVariablesInStubs()
await executeCommand('git init && git add . && git commit -m "Init project"', newDirectory)
await executeCommand("make install", newDirectory)
await copySpecificStubs()

const needsToInstallDruidRepo = await confirm({message: 'Do you want to install the Dru^ID repository to contribute on the project?'})
if (needsToInstallDruidRepo) {
    await executeCommand('git clone git@github.com:web-id-fr/druid.git druid-repository', newDirectory)
    await addLocalRepositoryToComposerJson()
}

const needsToInstallDruidDemoData = await confirm({message: 'Do you want to seed the database with demo content?'})
if (needsToInstallDruidDemoData) {
    await executeCommand('make seed_demo', newDirectory)
}

await executeCommand('git add . && git commit -m "Install Dru^ID"', newDirectory)

const needsToInstallDebugTools = await confirm({message: 'Do you want to install Laravel debug bar + Telescope?'})
if (needsToInstallDebugTools) {
    await executeCommand('make install_debug_tools', newDirectory)
    await executeCommand('git add . && git commit -m "Add debug tools"', newDirectory)
}

await openBrowser()

console.info('✅ All done! Ready to go.')

async function execLaravelInstallCommand(command: string) {
    console.info("🚀 Installing Laravel...")
    await new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(new Error(`Erreur lors de l'installation de Laravel : ${error.message}`))
            } else if (stderr) {
                resolve(stderr)
            } else {
                resolve(stdout)
            }
        })
    })
}

async function copyStubs() {
    console.info("🚀 Copying stubs toto...")
    console.info((distDirectory))
    await fs.copy(path.join(distDirectory, 'stubs'), newDirectory)
}

async function copySpecificStubs() {
    console.info("🚀 Copying specific stubs...")
    await fs.copy(path.join(distDirectory, '/stubs/app/Providers/Filament'), path.join(newDirectory, '/app/Providers/Filament'))
}

async function replaceVariablesInStubs() {
    console.info("🚀 Replacing in stubs...")
    const dockerfilePath = path.join(newDirectory, '/docker/dev/php-fpm/Dockerfile')

    await replaceInFile(dockerfilePath, 'PHPVERSION', phpVersion.replace('_', '.'))
}

async function replaceInFile(filePath: string, searchValue: string, replaceValue: string) {
    try {
        let content = await fs.readFile(filePath, 'utf8')
        content = content.replace(new RegExp(searchValue, 'g'), replaceValue)
        await fs.writeFile(filePath, content, 'utf8')
    } catch (error) {
        console.error(`Error while replacing content in file ${filePath} :`, error)
    }
}

async function executeCommand(command: string, directory: string) {
    console.info("🚀 Running command " + command + "...")
    await new Promise<void>((resolve, reject) => {
        exec(command, {cwd: directory}, (error, stdout, stderr) => {
            if (error) {
                reject(new Error(`Error during command execution: ${error.message}`))
            } else {
                console.log(stdout)
                resolve()
            }
        })
    })
}

async function addLocalRepositoryToComposerJson() {
    console.info("🚀 Adding symlink to druid repo...")
    const composerPath = path.join(newDirectory, 'composer.json')
    const composerJson = await fs.readJson(composerPath)

    composerJson.repositories = composerJson.repositories || []
    composerJson.repositories.push({
        type: "path",
        url: "./druid-repository",
        options: {
            symlink: true
        }
    })

    await fs.writeJson(composerPath, composerJson, {spaces: 4})
}

async function openBrowser() {
    console.info("🚀 Opening browser with admin URL... (use test@example.com / password)")
    open('https://druid-container.localhost/admin')
}

