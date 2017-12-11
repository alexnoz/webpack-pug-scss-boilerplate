const path = require('path')

exports.paths = {
  app: path.join(__dirname, 'app'),
  build: path.join(__dirname, 'build')
}

exports.assets = {
  legacy: 'assets-legacy.json',
  modern: 'assets-modern.json'
}

exports.entryPoints = {
  main: 'main',
  vendor: 'vendor',
  manifest: 'manifest'
}
