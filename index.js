const through2 = require('through2');
const gutil = require('gulp-util');
const path = require('path');
const postcss = require('postcss');
const _ = require('lodash');
const Spritesmith = require('spritesmith');
const fs = require('fs-extra');
const File = gutil.File;

var PluginError = gutil.PluginError;

const PLUGIN_NAME = 'gulp-sprity';

function parse(root, options) {
    var backgroundImageList = [];

    var spriteMark = _.isUndefined(options.spriteMark) ? '\\#sprite' : options.spriteMark;
    var reg = new RegExp('url\\s*\\(\\s*[\'"]?' + '([^\'"]*)' + spriteMark + '[^\'"]*[\'"]?\\)');

    var context = this;

    var backgroundNodeList = _.filter(root.nodes, function (node) {
        if (node.type === 'rule') {
            return _.findLast(node.nodes, function (subNode) {
                if (subNode.type === 'decl' &&
                    (subNode.prop === 'background' || subNode.prop === 'background-image') &&
                    reg.test(subNode.value)) {
                    backgroundImageList.push({
                        src: reg.exec(subNode.value)[1]
                    });
                    return true;
                }
            });
        }
    });

    return {
        backgroundImageList: backgroundImageList,
        backgroundNodeList: backgroundNodeList
    };
}

function existFile(fp) {
    var flag;
    if (path.isAbsolute(fp)) {
        try {
            var stat = fs.statSync(fp);
            flag = stat.isFile();
        } catch (err) {
            flag = false;
        }
    } else {
        flag = false;
    }

    return flag;
}

function resolveImages(file, backgroundImageList) {
    var sprites = [];

    backgroundImageList.forEach(function (backgroundImage) {
        var src = backgroundImage.src;
        var curDir = path.dirname(file.path);
        var imgPath = path.join(curDir, src);

        var relativePath = path.relative(curDir, src);

        var targetPath = '';

        relativePath = path.resolve(curDir, relativePath);

        if (existFile(src)) { //absolute path
            targetPath = src;
        } else if (existFile(imgPath)) { //relative path
            targetPath = imgPath;
        } else if (existFile(relativePath)) { //relative path
            targetPath = relativePath;
        } else { //parse with the same part of the path
            var curDirArr = curDir.split(path.sep); //root
            var srcArr = src.split(path.sep);

            var inter = _.intersection(curDirArr, srcArr).join(path.sep);
            var preDir = curDir.split(inter)[0];
            var postDir = src.split(inter)[1];
            relativePath = path.join(preDir, inter, postDir)
            if (existFile(relativePath)) {
                targetPath = relativePath;
            }
        }

        if (targetPath) {
            backgroundImage.src = targetPath;
            sprites.push(backgroundImage.src);
        }
    });

    return sprites;
}


function intersectString() {
    var args = [].slice.call(arguments);
    if (args.length < 2) {
        return args[0] || '';
    }
    var str1 = args.shift();
    var str2 = args.shift();
    var str1Arr = str1.split(path.sep);
    var str2Arr = str2.split(path.sep);
    var i;
    var len = Math.min(str1Arr.length, str2Arr.length);

    for (i = 0; i < len; i++) {
        if (str1Arr[i] != str2Arr[i]) {
            break;
        }
    }

    var sameStr = str2Arr.slice(0, i).join(path.sep);

    if (args.length === 0) {
        return sameStr;
    } else {
        args.unshift(sameStr);
        return intersectString.apply(null, args);
    }
}

function getImgsUnionDir(paths) {
    var imgUnionDir = intersectString.apply(null, paths);

    try {
        var stat = fs.statSync(imgUnionDir);
        if (stat.isFile()) {
            imgUnionDir = path.dirname(imgUnionDir);
        } else if (!stat.isDirectory()) {
            imgUnionDir = '';
        }
    } catch (err) {
        imgUnionDir = '';
    }

    return imgUnionDir;
}

function createSpriteImage(file, sprites, options, callback) {

    Spritesmith.run({src: sprites}, function (err, result) {
        if (err) {
            throw new Error(err);
        }
        var imgUnionDir = getImgsUnionDir(Object.keys(result.coordinates));
        var fileName = path.basename(file.path, path.extname(file.path));
        var dir = path.dirname(file.path);
        var imgFilePath;
        var backgroungImageUrl;

        if (_.isFunction(options.spriteFileNameReplacer)) {
            backgroungImageUrl = options.spriteFileNameReplacer(fileName);
        } else {
            fileName += '_sprite.png';
        }

        if (options.keepInRoot && imgUnionDir) {
            imgFilePath = path.join(imgUnionDir, 'sprites', fileName);
            backgroungImageUrl = path.relative(imgUnionDir, imgFilePath);
        } else if (options.spritePrefix) {
            backgroungImageUrl = imgFilePath = options.spritePrefix + fileName;
        } else {
            imgFilePath = path.join(dir, 'sprites', fileName);
            backgroungImageUrl = path.relative(dir, imgFilePath);
        }

        if (_.isFunction(options.backgroundUrlHandler)) {
            backgroungImageUrl = options.backgroundUrlHandler(backgroungImageUrl, imgFilePath, file.path);
        }

        if (_.isFunction(options.spritePathReplacer)) {
            imgFilePath = options.spritePathReplacer(imgFilePath, backgroungImageUrl, file.path);
        } else if (!options.spritePrefix) {
            imgFilePath = path.relative(file.base, imgFilePath);
        }

        var imgFile = new gutil.File({
            path: imgFilePath,
            contents: result.image
        });

        result.imgFile = imgFile;
        result.imgPath = imgFilePath;
        result.backgroungImageUrl = backgroungImageUrl;
        callback(result);
    });
}

function outpuSpriteImageProp(result, imageAndNodes, options) {
    var backgroundNodeList = imageAndNodes.backgroundNodeList;
    var backgroundImageList = imageAndNodes.backgroundImageList;

    var coordinates = result.coordinates;
    var imagePixelRatio = options.imagePixelRatio;
    _.each(backgroundNodeList, function (backgroundNode, i) {
        var offset = coordinates[backgroundImageList[i].src];

        //to fit the mobile device pixel ratio for retina image
        if (imagePixelRatio) {
            backgroundNode.append({
                prop: 'background-size',
                value: [parseInt(offset.width / imagePixelRatio) + 'px', parseInt(offset.height / imagePixelRatio) + 'px'].join(' ')
            });

            offset.x = parseInt(offset.x / imagePixelRatio);
            offset.y = parseInt(offset.y / imagePixelRatio);
        }

        backgroundNode.append({
            prop: 'background-image',
            value: 'url(' + result.backgroungImageUrl + ')'
        });

        backgroundNode.append({
            prop: 'background-position',
            value: [(-offset.x) + (offset.x ? 'px' : ''),
                (-offset.y) + (offset.y ? 'px' : '')].join(' ')
        });
    });
}


module.exports = function (options) {
    options = options || {};

    return through2.obj(function (file, enc, callback) {
        if (file.isNull()) {
            return callback(null, file);
        }

        if (file.isStream()) {
            return callback(new PluginError(PLUGIN_NAME, 'stream is not supported'), file);
        }

        var content = file.contents.toString();
        var root = postcss.parse(content);

        var self = this;
        var imageAndNodes = parse(root, options);
        if (imageAndNodes.backgroundImageList.length > 0) {
            var sprites = resolveImages(file, imageAndNodes.backgroundImageList);
            if (sprites.length > 0) {
                createSpriteImage(file, sprites, options, function (result) {
                    self.push(result.imgFile);

                    outpuSpriteImageProp(result, imageAndNodes, options);
                    file.contents = new Buffer(root.toResult().css);
                    self.push(file);
                    return callback();
                });
            } else {
                callback(null, file);
            }
        } else {
            callback(null, file);
        }
    });
};