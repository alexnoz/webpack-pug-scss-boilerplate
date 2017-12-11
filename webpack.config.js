const path = require('path')
const glob = require('glob')

const webpack = require('webpack')
const merge = require('webpack-merge')
const HtmlPlugin = require('html-webpack-plugin')
const ScriptExtHtmlPlugin = require('script-ext-html-webpack-plugin')
const FriendlyErrorsPlugin = require('friendly-errors-webpack-plugin')
const StylelintPlugin = require('stylelint-webpack-plugin')
const ManifestPlugin = require('webpack-manifest-plugin')
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
const IgnoreEmitPlugin = require('ignore-emit-webpack-plugin')

const parts = require('./webpack.parts')

const { paths, assets, entryPoints } = require('./consts')

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
const lintStylesOptions = {
  context: path.resolve(__dirname, `${paths.app}/styles`),
  syntax: 'scss',
  emitErrors: false
  // fix: true,
}

const cssPreprocessorLoader = { loader: 'fast-sass-loader' }

const commonConfig = merge([
  {
    context: paths.app,
    resolve: {
      unsafeCache: true,
      symlinks: false
    },
    entry: `${paths.app}/scripts`,
    output: {
      path: paths.build,
      publicPath: parts.publicPath
    },
    plugins: [
      new FriendlyErrorsPlugin()
    ],
    module: {
      noParse: /\.min\.js/
    }
  },
  parts.loadPug(),
  parts.loadFonts({
    include: paths.app,
    options: {
      name: 'fonts/[name].[hash:8].[ext]'
    }
  })
])

const commonProdConfig = merge(
  {
    performance: {
      hints: 'warning', // 'error' or false are valid too
      maxEntrypointSize: 100000, // in bytes
      maxAssetSize: 450000 // in bytes
    },
    plugins: [
      new webpack.HashedModuleIdsPlugin()
    ]
  },
  parts.minifyJS(),
  parts.extractBundles([
    {
      name: entryPoints.vendor,

      minChunks: ({ resource }) => (
        resource &&
        resource.indexOf('node_modules') >= 0 &&
        resource.match(/\.js$/)
      )

    },
    // should be the last definition
    {
      name: entryPoints.manifest,
      minChunks: Infinity
    }
  ]),
  parts.purifyCSS({
    paths: glob.sync(`${paths.app}/**/*.+(pug|js)`, { nodir: true }),
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
  parts.extractCSS({
    include: paths.app,
    use: [parts.autoprefix(), cssPreprocessorLoader]
  }),
  parts.loadImages({
    include: paths.app,
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
)

const modernProdConfig = merge([
  {
    output: {
      chunkFilename: 'scripts/[name].[chunkhash:8].js',
      filename: 'scripts/[name].[chunkhash:8].js'
    },
    plugins: [
      new HtmlPlugin({
        template: './index.pug',
        inject: 'head',
        minify: {
          minifyJS: true,
          minifyCSS: true,
          removeComments: true
        }
      }),
      new ScriptExtHtmlPlugin({
        module: /.*/
      }),
      new ManifestPlugin({
        fileName: assets.modern,
        publicPath: parts.publicPath
      }),
      new StylelintPlugin(lintStylesOptions),
      // only generate `stats.json` without opening a browser tab
      new BundleAnalyzerPlugin({
        analyzerMode: 'disabled',
        generateStatsFile: true
      })
    ]
  },
  parts.lintJS({ include: paths.app, options: lintJSOptions }),
  parts.loadJS({
    include: paths.app,
    options: {
      cacheDirectory: true,
      presets: [
        [
          'env', {
            modules: false,
            useBuiltIns: true,
            targets: {
              // the latest stable browsers, from `caniuse`
              browsers: [
                'Chrome >= 62',
                'Safari >= 11',
                'iOS >= 10.3',
                'Firefox >= 57',
                'Edge >= 16'
              ]
            }
          }
        ]
      ]
    }
  })
])

const legacyProdConfig = merge([
  {
    output: {
      chunkFilename: 'scripts/[name]-legacy.[chunkhash:8].js',
      filename: 'scripts/[name]-legacy.[chunkhash:8].js'
    },
    plugins: [
      new ManifestPlugin({
        fileName: assets.legacy,
        publicPath: parts.publicPath,
        // append `-legacy` suffix to static `.js` chunks
        map (opts) {
          let name = opts.name
          if (name.includes('-legacy')) return opts

          const i = name.indexOf('.js')
          if (~i) {
            name = name.slice(0, i) + '-legacy' + name.slice(i)
            opts.name = name
          }

          return opts
        }
      }),
      // Ignore all files except `.js`
      // since we already bundle everything in the modern config
      new IgnoreEmitPlugin(
        /\.(s?css|woff2?|svg|png|jpe?g|gif)$/
      )
    ]
  },
  parts.loadJS({
    include: paths.app,
    options: {
      cacheDirectory: true,
      presets: [
        [
          'env', {
            modules: false,
            useBuiltIns: true,
            targets: {
              browsers: [
                '> 1%',
                'last 2 versions'
              ]
            }
          }
        ]
      ]
    }
  })
])

const developmentConfig = merge([
  {
    // devtool: 'cheap-module-eval-source-map',
    output: {
      devtoolModuleFilenameTemplate: 'webpack:///[absolute-resource-path]'
    },
    plugins: [
      new HtmlPlugin({
        template: './index.pug'
      }),
      new webpack.NamedModulesPlugin(),
      new StylelintPlugin(lintStylesOptions)
    ]
  },
  parts.devServer({
    host: process.env.HOST,
    port: process.env.PORT
  }),
  parts.lintJS({ include: paths.app, options: lintJSOptions }),
  parts.loadCSS({ include: paths.app, use: [cssPreprocessorLoader] }),
  parts.loadImages({include: paths.app})
])

module.exports = env => {
  process.env.BABEL_ENV = env

  if (env === 'production') {
    return [
      merge(commonConfig, commonProdConfig, modernProdConfig),
      merge(commonConfig, commonProdConfig, legacyProdConfig)
    ]
  }

  return merge(commonConfig, developmentConfig)
}
