const fs = require('fs');

function replaceChunk(content: string, marker: string, chunk: string) {
    let re = new RegExp(`<!\-\- ${marker} starts \-\->.*<!\-\- ${marker} ends \-\->`, 's');
    let newCnt = `<!-- ${marker} starts -->\n${chunk}\n<!-- ${marker} ends -->`;
    return content.replace(re, newCnt);
}

export function saveReadme(newCnt: string) {
    const IS_LOCAL = process.env.IS_LOCAL;
    const mainImg = IS_LOCAL
        ? '![](src/assets/main.svg)'
        : '![](https://raw.githubusercontent.com/maxzz/maxzz/master/src/assets/main.svg)';
    const mainHiImg = IS_LOCAL
        ? '![](src/assets/main-hi.svg)'
        : '![](https://raw.githubusercontent.com/maxzz/maxzz/master/src/assets/main-hi.svg)';
    const photeImg = IS_LOCAL
        ? '![](src/assets/maxz-128.png)'
        : '![](https://raw.githubusercontent.com/maxzz/maxzz/master/src/assets/maxz-128.png)';

    let cnt = fs.readFileSync('./src/assets/README-template.md').toString();
    cnt = cnt.replace(/\!\[\]\((\S*)src\/assets\/main\.svg\)/, mainImg);
    cnt = cnt.replace(/\!\[\]\((\S*)src\/assets\/main-hi\.svg\)/, mainHiImg);
    cnt = cnt.replace(/\!\[\]\((\S*)src\/assets\/maxz-128\.png\)/, photeImg);
    cnt = replaceChunk(cnt, 'recent_releases', newCnt);
    fs.writeFileSync('./README.md', cnt);
}
