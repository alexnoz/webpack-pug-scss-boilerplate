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

/*
  To move all assets to some static folder
  getPaths({ staticDir: 'some-name' })

  To rename asset build folder
  getPaths({ js: 'some-name' })

  To move assets to the root build folder
  getPaths({ css: '' })

  Defaults values:
     sourceDir - 'app',
      buildDir - 'build',
     staticDir - '',

        images - 'images',
         fonts - 'fonts',
           css - 'styles',
            js - 'scripts'
*/
const paths = getPaths()

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
  parts.lintJS({ include: paths.app, options: lintJSOptions }),
  parts.loadFonts({
    include: paths.app,
    options: {
      name: `${paths.fonts}/[name].[hash:8].[ext]`
    }
  })
])

const productionConfig = merge([
  {
    mode: 'production',
    optimization: {
      splitChunks: {
        chunks: 'all',
        name: 'vendors'
      },
      runtimeChunk: {
        name: 'manifest'
      }
    },
    output: {
      chunkFilename: `${paths.js}/[name].[chunkhash:8].js`,
      filename: `${paths.js}/[name].[chunkhash:8].js`
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
      new CleanPlugin(paths.build)
    ]
  },
  parts.minifyJS({
    uglifyOptions: {
      parse: {
      // we want uglify-js to parse ecma 8 code. However, we don't want it
      // to apply any minfication steps that turns valid ecma 5 code
      // into invalid ecma 5 code. This is why the 'compress' and 'output'
      // sections only apply transformations that are ecma 5 safe
      // https://github.com/facebook/create-react-app/pull/4234
        ecma: 8
      },
      compress: {
        ecma: 5,
        warnings: false,
        // Disabled because of an issue with Uglify breaking seemingly valid code:
        // https://github.com/facebook/create-react-app/issues/2376
        // Pending further investigation:
        // https://github.com/mishoo/UglifyJS2/issues/2011
        comparisons: false
      },
      mangle: {
        safari10: true
      },
      output: {
        ecma: 5,
        comments: false,
        // Turned on because emoji and regex is not minified properly using default
        // https://github.com/facebook/create-react-app/issues/2488
        ascii_only: true
      }
    },
    // Use multi-process parallel running to improve the build speed
    // Default number of concurrent runs: os.cpus().length - 1
    parallel: true,
    // Enable file caching
    cache: true
  }),
  parts.loadJS({
    include: paths.app,
    options: {
      cacheDirectory: true
    }
  }),
  parts.extractCSS({
    include: paths.app,
    use: [parts.autoprefix(), cssPreprocessorLoader],
    options: {
      filename: `${paths.css}/[name].[contenthash:8].css`,
      chunkFilename: `${paths.css}/[id].[contenthash:8].css`
    }
  }),
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
  parts.loadImages({
    include: paths.app,
    options: {
      limit: 15000,
      name: `${paths.images}/[name].[hash:8].[ext]`
    }
  }),
  // should go after loading images
  parts.optimizeImages()
])

const developmentConfig = merge([
  {
    mode: 'development'
  },
  parts.devServer({
    host: process.env.HOST,
    port: process.env.PORT
  }),
  parts.loadCSS({ include: paths.app, use: [cssPreprocessorLoader] }),
  parts.loadImages({include: paths.app})
])

module.exports = env => {
  process.env.BABEL_ENV = env

  if (env === 'production') {
    return merge(commonConfig, productionConfig)
  }

  return merge(commonConfig, developmentConfig)
}

function getPaths ({
  sourceDir = 'app',
  buildDir = 'build',
  staticDir = '',
  images = 'images',
  fonts = 'fonts',
  js = 'scripts',
  css = 'styles'
} = {}) {
  const assets = { images, fonts, js, css }

  return Object.keys(assets).reduce((obj, assetName) => {
    const assetPath = assets[assetName]

    obj[assetName] = !staticDir ? assetPath : `${staticDir}/${assetPath}`

    return obj
  }, {
    app: path.join(__dirname, sourceDir),
    build: path.join(__dirname, buildDir),
    staticDir
  })
}
