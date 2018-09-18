# Webpack Pug SCSS Boilerplate

A webpack 4 based boilerplate for building web apps.

## Features:
* [Pug](https://pugjs.org) as a template engine
* [SCSS](http://sass-lang.com) preprocessor for CSS ([autoprefixer](https://github.com/postcss/autoprefixer) included)
* JS linting with [Eslint](https://eslint.org), extends [eslint-config-standard](https://github.com/standard/eslint-config-standard), includes the following plugins:
  * [import](https://github.com/benmosher/eslint-plugin-import)
  * [node](https://github.com/mysticatea/eslint-plugin-node)
  * [promise](https://github.com/xjamundx/eslint-plugin-promise)
  * [compat](https://github.com/amilajack/eslint-plugin-compat)
* CSS linting with [Stylelint](http://stylelint.io)

>Note: There is also the [feature/modern-bundle](https://github.com/alexnoz/webpack-pug-scss-boilerplate/tree/feature/modern-bundle) branch where `webpack` produces [two production bundles](https://philipwalton.com/articles/deploying-es2015-code-in-production-today/) (legacy & modern). It is experimental so use it with caution.

## Usage:
* Clone the repo via `git clone https://github.com/alexnoz/webpack-pug-scss-boilerplate.git`
* `cd webpack-pug-scss-boilerplate`
* Run `yarn install` to fetch all the dependencies
* Run `yarn start` to start the [webpack-dev-server](https://github.com/webpack/webpack-dev-server) (`localhost:8080` will be opened automatically)
* Start developing
* When you are done, run `yarn build` to get the prod version of your app
* If you want to analyze your production bundle, run `yarn run analyze` to kick off [webpack-bundle-analyzer](https://github.com/webpack-contrib/webpack-bundle-analyzer)

## Multiple pages:

With a few tweaks, you can use this boilerplate for multi-page apps. Suppose you have the following project structure:

```
app/
|-index.pug
|-index.js
|
|-about/
|   |-about.pug
|   |-index.js
|
...
```

1. Make the following tweaks to the `webpack.config.js`:
  ```javascript
  // webpack.config.js

  // ...

  const commonConfig = merge([
    // ...

    plugins: [
      // 1. Remove this plugin
      new HtmlPlugin({
        template: './index.pug'
      }),
      new FriendlyErrorsPlugin(),
      new StylelintPlugin(lintStylesOptions)
    ],

    // ...
  ])

  // ...

  // 2. Call `parts.page` for each page with necessary options
  const pages = [
    parts.page({
      title: 'Home',
      entry: {
        home: paths.app
      },
      template: path.join(paths.app, 'index.pug'),

      // An array of chunks to include in the page
      chunks: ['home', 'runtime', 'vendors']
    }),
    parts.page({
      title: 'About',
      path: 'about',
      entry: {
        about: path.join(paths.app, 'about')
      },
      template: path.join(paths.app, 'about/about.pug'),

      chunks: ['about', 'runtime', 'vendors']
    })
  ]

  // ...

  module.exports = env => {
    process.env.NODE_ENV = env

    const config = env === 'production'
      ? productionConfig
      : developmentConfig

    // 3. Merge these pages into the final config
    return merge(commonConfig, config, ...pages)
  }
  ```

  For details, please see `parts.page()` source and [html-webpack-plugin docs](https://github.com/jantimon/html-webpack-plugin#options).

2. For the live reload to work, you need to include the following snippet into every `index.js` file (for each page):

  ```javascript
  if (process.env.NODE_ENV !== 'production') {
    require('./path/to/page.pug');
  }
  ```
