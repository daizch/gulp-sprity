# gulp-sprity

[![NPM version](https://img.shields.io/npm/v/gulp-sprity.svg?style=flat)](https://www.npmjs.com/package/gulp-sprity)
[![Build Status](https://secure.travis-ci.org/Dijason/gulp-sprity.svg?branch=master)](http://travis-ci.org/Dijason/gulp-sprity)

> A [gulp](https://github.com/gulpjs/gulp) plugin to convert a set of images into a spritesheet.

## Usage

Firstly, install `gulp-sprity` as a development dependency:

```shell
npm install gulp-sprity --save-dev
```

Then, add it into your `gulpfile.js`:

**convert by default mode, background image url with end of #sprite:**

```javascript
const cleanCSS = require('gulp-clean-css');
const sprity = require("gulp-sprity");

gulp.src("./src/**/*.css")
    .pipe(sprity())
    .pipe(cleanCSS())
    .pipe(gulp.dest("build"));
```

## License

[MIT License](http://en.wikipedia.org/wiki/MIT_License)