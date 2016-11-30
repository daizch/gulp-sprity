const _ = require('lodash');
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const gutil = require('gulp-util');
const sprity = require('../index');
const vfs = require('vinyl-fs');
var through = require('through2');
const cleanCSS = require('gulp-clean-css');
const gulpif = require('gulp-if');

function fileTypeOf(type) {
    return function (file) {
        return path.extname(file.path) === '.' + type;
    };
}

describe('gulp-sprity', function() {
  var log;

    it('test imagePixelRatio', function (done) {
        vfs.src('test/fixtures/img-pixel-ratio.css')  //compare to style-1.css
            .pipe(sprity({
                imagePixelRatio: 2
            }))
            .pipe(gulpif(fileTypeOf('css'),cleanCSS()))
            .pipe(vfs.dest('./test/output/'))
            .on('end', done);
    });

  it('test image sprite', function (done) {
    vfs.src('test/fixtures/style-1.css')
        .pipe(sprity())
        .pipe(gulpif(fileTypeOf('css'),cleanCSS()))
        .pipe(vfs.dest('./test/output/'))
        .on('end', done);
  });

  it('test image sprite with unsprite', function (done) {
    vfs.src('test/fixtures/style-2.css')
        .pipe(sprity())
        .pipe(cleanCSS())
        .pipe(vfs.dest('./test/output/'))
        .on('end', done);
  });

  it('test image sprite with image file type of jpg', function (done) {
    vfs.src('test/fixtures/style-3.css')
        .pipe(sprity())
        .pipe(cleanCSS())
        .pipe(vfs.dest('./test/output/'))
        .on('end', done);
  });

  it('test spritePathReplacer', function (done) {
    vfs.src('test/fixtures/style-4.css')
        .pipe(sprity({
          spritePathReplacer: function (dir, name, filepath) {
            return dir + '/sprites/' + name;
          }
        }))
        .pipe(cleanCSS())
        .pipe(vfs.dest('./test/output/'))
        .on('end', done);
  });

  it('test backgroundUrlHandler', function (done) {
    vfs.src('test/fixtures/style-5.css')
        .pipe(sprity({
            backgroundUrlHandler: function (filepath) {
            return filepath + '?{md5}';
          }
        }))
        .pipe(cleanCSS())
        .pipe(vfs.dest('./test/output/'))
        .on('end', done);
  });

});
