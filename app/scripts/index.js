import './../styles/main.scss';

if (process.env.NODE_ENV !== 'production') {
  require('./../index.pug');
  require('./../includes/header.pug');
}
