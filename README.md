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
const gulpif = require('gulp-if');
const sprity = require('gulp-sprity');
const path = require('path');

function fileTypeOf(type) {
    return function (file) {
        return path.extname(file.path) === '.' + type;
    };
}

gulp.src("src/css/foo.css")
    .pipe(sprity())
    .pipe(gulpif(fileTypeOf('css'),cleanCSS()))
    .pipe(gulp.dest("build"));
```

`input`

```css
/*foo.css*/
.icon {
    background-image: url('icon.png#sprite');
    background-repeat: no-repeat;
    width: 100px;
    height: 100px;
}
```

`output`

```css
/*foo.css*/
.icon {
    background-image: url('sprites/foo_sprite.png');
    background-repeat: no-repeat;
    background-position: -334px 0
    width: 100px;
    height: 100px;
}
```

** imagePixelRatio **
```javascript
gulp.src("src/css/foo.css")
    .pipe(sprity({imagePixelRatio:2}))
    .pipe(gulpif(fileTypeOf('css'),cleanCSS()))
    .pipe(gulp.dest("build"));
```

`input`

```css
/*foo.css*/
.icon {
    background-image: url('icon.png#sprite');
    background-repeat: no-repeat;
    width: 100px;
    height: 100px;
}
```

`output`

```css
/*foo.css*/
.icon {
    background-image: url('sprites/foo_sprite.png');
    background-repeat: no-repeat;
    background-position: -300px 40px; //ps: original position is -600px and 80px
    background-size: 400px 300px;  //ps: original size is 800px and 600px
    width: 100px;
    height: 100px;
}
```

**spritePrefix usage:**

```javascript
const cleanCSS = require('gulp-clean-css');
const gulpif = require('gulp-if');
const sprity = require('gulp-sprity');
const path = require('path');

function fileTypeOf(type) {
    return function (file) {
        return path.extname(file.path) === '.' + type;
    };
}

gulp.src("src/css/foo.css")
    .pipe(sprity({
        spritePrefix: 'demo/css/sprites/'
    }))
    .pipe(gulpif(fileTypeOf('css'),cleanCSS()))
    .pipe(gulp.dest("build"));
```

**the same as:**

```javascript
sprity({
        backgroundUrlHandler: function(backgroungImageUrl, imgFilePath) {
            return 'demo/css/' + backgroungImageUrl;
        },
        spritePathReplacer: function(imgFilePath, backgroungImageUrl) {
            return 'demo/css/' + backgroungImageUrl;
        }
    })
```

`output like:`

```css
/*foo.css*/
.icon {
    background-image: url('demo/css/sprites/foo_sprite.png'); /*image file will be saved at build/demo/css/sprites/foo_sprite.png*/
    background-repeat: no-repeat;
    background-position: -334px 0
    width: 100px;
    height: 100px;
}
```


## Parameters

### keepInRoot
Type: `bool`
default `undefined`

To mark whether put the image files into the same directory of image file path. For example, one file path is /Users/demo/src/images/dir1/img1.png. Another one is /Users/demo/src/images/dir2/img2.png. Then the spriter will be saved in /Users/demo/src/images.

### spriteMark
Type: `String`
default `#sprite`

To mark which image should be merged into a spritesheet.


### spritePrefix
Type: `String`
default: `undefined`

To add the prefix directory path of spritesheet and save the sprited image to the prefix directory.


### imagePixelRatio
Type: Integer
default `undefined`

To scale the background-size and background-position of the spriter for HD images. 


### spriteFileNameReplacer
Type: `Function`
default: `undefined`

Parameters:
* fileName: the file name of the original css file with no extname.

To change the file name of the sprited image.

### backgroundUrlHandler
Type: `Function`
default `undefined`

Parameters:
* imgFilePath: origin saved path of spritesheet
* filePath: the file path of original file

To handle the url of background-image, output what you want to insert into css file.

### spritePathReplacer
Type: `Function`
default `undefined`

Parameters:
* dir: backgroung image url which will be injected into css file
* imgFilePath: origin saved path of spritesheet
* filePath: the file path of original file


To replace the path of a spritesheet where you want to save the spritesheet.


## License

[MIT License](http://en.wikipedia.org/wiki/MIT_License)