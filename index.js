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


function getBackgroundImageAndNodeList(root, options) {
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

function resolveImages(file, backgroundImageList) {
    var sprites = []
    backgroundImageList.forEach(function (backgroundImage) {
        backgroundImage.src = path.resolve(path.dirname(file.path), backgroundImage.src);
        sprites.push(backgroundImage.src);
    });

    return sprites;
}

function createSpriteImage(file, sprites, options, callback) {
    var fileName = path.basename(file.path, path.extname(file.path));
    var dir = path.dirname(file.path);
    fileName += '-sprite.png';
    var filePath = dir + '/images/' + fileName;

    if (_.isFunction(options.spritePathReplacer)) {
        filePath = options.spritePathReplacer(dir, fileName, file.path);
    }

    Spritesmith.run({src: sprites}, function (err, result) {
        if (err) {
            throw new Error(err);
        }

        fs.ensureFileSync(filePath);
        fs.writeFileSync(filePath, result.image);
        // var imgFile;
        // var imgFile = new gutil.File({
        //     // cwd: file.cwd,
        //     // base: file.base,
        //     path: filePath,
        //     contents: new Buffer(fs.readFileSync(filePath))//result.image
        // });
        var backgroungImageUrl = filePath;
        backgroungImageUrl = path.relative(file.path, backgroungImageUrl);

        if (_.isFunction(options.urlHandler)) {
            backgroungImageUrl = options.urlHandler(backgroungImageUrl, filePath);
        }

        result.backgroungImageUrl = backgroungImageUrl;
        callback(result);
    });
}

function addSpriteImageProp(result, imageAndNodes) {
    var backgroundNodeList = imageAndNodes.backgroundNodeList;
    var backgroundImageList = imageAndNodes.backgroundImageList;

    var coordinates = result.coordinates;
    _.each(backgroundNodeList, function (backgroundNode, i) {
        var offset = coordinates[backgroundImageList[i].src];

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
        var imageAndNodes = getBackgroundImageAndNodeList(root, options);
        if (imageAndNodes.backgroundImageList.length > 0) {
            var sprites = resolveImages(file, imageAndNodes.backgroundImageList);
            createSpriteImage(file, sprites, options, function (result) {
                // self.push(imgFile);
                addSpriteImageProp(result, imageAndNodes);
                file.contents = new Buffer(root.toResult().css);
                self.push(file);
                return callback();
            });
        } else {
            callback(null, file);
        }
    });
};