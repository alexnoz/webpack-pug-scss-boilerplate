const path = require('path')
const fs = require('fs')
const { promisify } = require('util')
const unlink = promisify(fs.unlink)
const writeFile = promisify(fs.writeFile)

const chalk = require('chalk')
const mergeJson = require('merge-json')

const { paths, assets, entryPoints } = require('./consts')
const legacy = require(`./build/${assets.legacy}`)
const modern = require(`./build/${assets.modern}`)

start()
async function start () {
  try {
    log('[postbuild]:')

    await Promise.all([
      appendLegacyScripts(getLegacyScripts()),
      mergeManifests()
    ])

    log('\n  DONE')
  } catch (err) {
    console.error(chalk`{redBright ${err}}`)
  }
}

function log (text) {
  console.log(chalk`{blue ${text}}`)
}

function mergeManifests () {
  log('  merging manifests...')

  const merged = mergeJson.merge(legacy, modern)

  return new Promise((resolve, reject) => {
    const promise =
      writeFile(path.join(paths.build, 'assets.json'), JSON.stringify(merged))

    const promises = Object.values(assets).map(f =>
      unlink(path.join(paths.build, f))
    )

    Promise.all([promise, ...promises]).then(resolve).catch(reject)
  })
}

function appendLegacyScripts (scripts) {
  log("  appending 'nomodule' scripts...")

  const indexPath = path.join(paths.build, 'index.html')
  let html = fs.readFileSync(indexPath)
  const index = html.indexOf('</body>')

  html = html.slice(0, index) + scripts + html.slice(index)

  return writeFile(indexPath, html)
}

function getLegacyScripts () {
  // This is needed to preserve the right scripts' order.
  const chunks = [
    entryPoints.manifest,
    entryPoints.vendor,
    entryPoints.main
  ]
  const legacyFiles = Object.keys(legacy)

  return chunks.reduce((str, chunk) => {
    const file = legacyFiles.find(f => f.includes(chunk))
    if (file)
      str += `<script nomodule src="${legacy[file]}"></script>`
    return str
  }, '')
}
