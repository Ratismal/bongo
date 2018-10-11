const GIFEncoder = require('gifencoder');
const Jimp = require('jimp');
const fs = require('fs');
const path = require('path');

async function start() {
    const pattern = require('./input/pattern');

    let up, down;

    up = await Jimp.read('./input/up.png');
    down = await Jimp.read('./input/down.png');

    let height = up.bitmap.height, width = up.bitmap.width;
    if (height !== down.bitmap.height || width !== down.bitmap.width)
        throw new Error('Mismatching dimensions!');

    console.log('Generating a bongocat with the dimentions %dx%d', width, height);

    let encoder = new GIFEncoder(width, height);
    encoder.createReadStream().pipe(fs.createWriteStream(path.join(__dirname, 'output', 'output.gif')));
    encoder.start();
    encoder.setRepeat(0);
    encoder.setDelay(100);
    encoder.setQuality(10);

    // directions are **arms**, not sides
    const rightUp = up.clone().crop(0, 0, width / 2, height);
    const rightDown = down.clone().crop(0, 0, width / 2, height);
    const leftUp = up.clone().crop(width / 2, 0, width / 2, height);
    const leftDown = down.clone().crop(width / 2, 0, width / 2, height);

    const rightMask = 0b01;
    const leftMask = 0b10;

    let base = new Jimp(width, height);
    base.background(0x1b684dff);

    let i = 1;
    for (const state of pattern) {
        process.stdout.write('\rFrame ' + i++ + '/' + pattern.length);
        let right = state & rightMask ? rightDown : rightUp;
        let left = state & leftMask ? leftDown : leftUp;
        let temp = base.clone();

        temp.composite(right, 0, 0);
        temp.composite(left, width / 2, 0);

        encoder.addFrame(temp.bitmap.data);
    }

    process.stdout.write('\n');
    encoder.finish();
}

start().then(() => {
    console.log('Finished!');
}).catch(err => {
    console.error(err);
});