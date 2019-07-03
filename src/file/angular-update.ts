import * as execa from 'execa'
import * as vscode from 'vscode'

import {
  storeUpgradeVersion,
  upgradeVersionExists,
} from '../common/upgrade-version.helpers'

const CLI_CHK_CMD = 'npm info @angular/cli'
const NG_ALL_CMD = 'ng update --all '
const workspace = vscode.workspace.workspaceFolders![0]

export enum UpdateArgs {
  next = '--next',
  force = '--force',
}

export async function ngUpdate(args?: UpdateArgs[]): Promise<boolean> {
  // this is an issue because the user may choose latest the first time.
  // really this should update each time or we need ui to set proper.
  /* if (!upgradeVersionExists()) {
    storeUpgradeVersion(next)
  } */
  let updateCMD = NG_ALL_CMD + (args ? args.join(' ') : '')
  const render = (<any>vscode.window).createTerminalRenderer('Angular Evergreen 🌲')
  render.terminal.show()
  render.write('\x1b[32m 🌲  Welcome to Angular Evergreen 🌲 \r\n\n')
  try {
    await runScript(render, 'npm install')
    await runScript(render, updateCMD)

    return true
  } catch (error) {
    let msg = error.message.replace(/[\n\r]/g, ' ').replace(/\s+/, '')
    render.write(`\r\n ${msg} \r\n`)
    forceUpdate(render, `${updateCMD} ${UpdateArgs.force}`)
    return false
  }
}

async function runScript(render: any, script: string, format: boolean = true) {
  render.write(`Executing: ${script}\r\n`)
  const scriptStdout = await execa.shell(script, { cwd: workspace.uri.path })
  const renderText = format
    ? scriptStdout.stdout.replace(/[\n\r]/g, ' ').replace(/\s+/, '')
    : scriptStdout.stdout
  render.write(renderText)
  render.write('\r\n')
}

function checkStringForErrors(inString: string): boolean {
  return (
    inString.includes('Error') ||
    inString.includes('ERROR') ||
    inString.includes('Fail') ||
    inString.includes('failed')
  )
}

function forceUpdate(render: any, cmd: string) {
  vscode.window
    .showErrorMessage(
      "Can't update: Do you want to try and force the update?",
      {},
      'CANCEL',
      'FORCE (risky)'
    )
    .then(async value => {
      if (!value || value === '') {
        return
      } else {
        if (value.includes('FORCE')) {
          try {
            render.write('\r\n\r\nMay the Force be with you! \r\n')
            await runScript(render, cmd)
          } catch (error) {
            let msg = error.message.replace(/[\n\r]/g, ' ').replace(/\s+/, '')
            render.write(`\r\n ${msg} \r\n 🌲 Force Complete 🌲\r\n`)
            return false
          }
        }
      }
    })
}
