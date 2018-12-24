#!/usr/bin/env node
'use strict';

const program = require('commander');
const path = require('path');
const fs = require('fs');
const jsdom = require("jsdom");
const {JSDOM} = jsdom;

let main = (directory) => {
    let htmlFiles = scanDir(directory, ".html");
    if (htmlFiles.length > 0) {
        attach(htmlFiles[0]);
    }
};

/**
 *
 * Find all html file in directory
 *
 * @param startPath
 * @param filter
 * @returns {Array}
 */
let scanDir = (startPath, filter) => {
    let result = [];
    if (!fs.existsSync(startPath)) {
        return result;
    }

    const files = fs.readdirSync(startPath);
    for (let i = 0; i < files.length; i++) {
        const filename = path.join(startPath, files[i]);
        const stat = fs.lstatSync(filename);
        if (stat.isDirectory()) {
            result = result.concat(scanDir(filename, filter));
        } else if (filename.indexOf(filter) >= 0) {
            result.push(filename);
        }
    }

    return result;
};

/**
 * Attach track to each video tag
 *
 * @param file
 * @return string
 */
let attach = (file) => {
    JSDOM.fromFile(file).then(dom => {
        const vidSrcSelectors = dom.window.document.querySelectorAll('source');
        vidSrcSelectors.forEach(vidSrcSelector => {
            if (vidSrcSelector.getAttribute('type') === 'video/mp4') {
                const srcVid = vidSrcSelector.getAttribute('src');
                vidSrcSelector.insertAdjacentHTML('afterend', generateTrackFromVideoSource(srcVid));
            }
        });

        fs.writeFile(file, dom.serialize(), function (err) {
            if (err) {
                return console.log(err);
            }
            console.log("The file was saved!")
        })
    });
};

let generateTrackFromVideoSource = (videoSource) => {
    const src = videoSource.replace(/mp4$/, 'en.vtt');
    return '<track src="' + src + ' " kind="subtitles" srclang="en" label="English" default/>'
};


program.version('1.0.0')
    .description('Attach subtitles for each video downloaded by udacimak');

program.command('attach [directory]')
    .alias('a')
    .action(main);

program.parse(process.argv);
