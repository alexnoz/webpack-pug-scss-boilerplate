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
* When you are done, run `yarn run build` to get the prod version of your app



