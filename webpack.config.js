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
    entry: `${PATHS.app}/scripts`,
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
    include: PATHS.app,
    options: {
      cacheDirectory: true
    }
  }),
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
])

const developmentConfig = merge([
  {
    mode: 'development'
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
