const path = require('path')
const glob = require('glob')

const webpack = require('webpack')
const merge = require('webpack-merge')
const HtmlPlugin = require('html-webpack-plugin')
const FriendlyErrorsPlugin = require('friendly-errors-webpack-plugin')
const StylelintPlugin = require('stylelint-webpack-plugin')
const ManifestPlugin = require('webpack-manifest-plugin')
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
const CleanPlugin = require('clean-webpack-plugin')

const parts = require('./webpack.parts')

const lintJSOptions = {
  emitWarning: true,
  // Fail only on errors
  failOnWarning: false,
  failOnError: true,

  // Toggle autofix
  fix: true,
  cache: true,

  formatter: require('eslint-friendly-formatter')
}

const PATHS = {
  app: path.join(__dirname, 'app'),
  build: path.join(__dirname, 'build')
}

const lintStylesOptions = {
  context: path.resolve(__dirname, `${PATHS.app}/styles`),
  syntax: 'scss',
  emitErrors: false
  // fix: true,
}

const cssPreprocessorLoader = { loader: 'fast-sass-loader' }

const commonConfig = merge([
  {
    context: PATHS.app,
    resolve: {
      unsafeCache: true,
      symlinks: false
    },
    entry: `${paths.app}/scripts`,
    output: {
      path: PATHS.build,
      publicPath: parts.publicPath
    },
    plugins: [
      new HtmlPlugin({
        template: './index.pug'
      }),
      new FriendlyErrorsPlugin(),
      new StylelintPlugin(lintStylesOptions)
    ],
    module: {
      noParse: /\.min\.js/
    }
  },
  parts.loadPug(),
  parts.lintJS({ include: PATHS.app, options: lintJSOptions }),
  parts.loadFonts({
    include: PATHS.app,
    options: {
      name: 'fonts/[name].[hash:8].[ext]'
    }
  })
])

const productionConfig = merge([
  {
    output: {
      chunkFilename: 'scripts/[name].[chunkhash:8].js',
      filename: 'scripts/[name].[chunkhash:8].js'
    },
    performance: {
      hints: 'warning', // 'error' or false are valid too
      maxEntrypointSize: 100000, // in bytes
      maxAssetSize: 450000 // in bytes
    },
    plugins: [
      new webpack.HashedModuleIdsPlugin(),
      new ManifestPlugin(),
      new BundleAnalyzerPlugin(),
      new CleanPlugin(PATHS.build)
    ]
  },
  parts.minifyJS(),
  parts.loadJS({
    include: PATHS.app,
    options: {
      cacheDirectory: true
    }
  }),
  parts.extractBundles([
    {
      name: 'vendor',

      minChunks: ({ resource }) => (
        resource &&
        resource.indexOf('node_modules') >= 0 &&
        resource.match(/\.js$/)
      )

    },
    // should be the last definition
    {
      name: 'manifest',
      minChunks: Infinity
    }
  ]),
  parts.extractCSS({
    include: PATHS.app,
    use: [parts.autoprefix(), cssPreprocessorLoader]
  }),
  parts.purifyCSS({
    paths: glob.sync(`${PATHS.app}/**/*.+(pug|js)`, { nodir: true }),
    styleExtensions: ['.css', '.scss']
  }),
  parts.minifyCSS({
    options: {
      discardComments: {
        removeAll: true
      },
      // Run cssnano in safe mode to avoid
      // potentially unsafe transformations.
      safe: true
    }
  }),
  parts.loadImages({
    include: PATHS.app,
    options: {
      limit: 15000,
      name: 'images/[name].[hash:8].[ext]'
    }
  }),
  // should go after loading images
  parts.optimizeImages(),
  parts.setFreeVariable(
    'process.env.NODE_ENV',
    'production'
  )
])

const developmentConfig = merge([
  {
    // devtool: 'cheap-module-eval-source-map',
    output: {
      devtoolModuleFilenameTemplate: 'webpack:///[absolute-resource-path]'
    },
    plugins: [
      new webpack.NamedModulesPlugin()
    ]
  },
  parts.devServer({
    host: process.env.HOST,
    port: process.env.PORT
  }),
  parts.loadCSS({ include: PATHS.app, use: [cssPreprocessorLoader] }),
  parts.loadImages({include: PATHS.app})
])

module.exports = env => {
  process.env.BABEL_ENV = env

  if (env === 'production') {
    return merge(commonConfig, productionConfig)
  }

  return merge(commonConfig, developmentConfig)
}
