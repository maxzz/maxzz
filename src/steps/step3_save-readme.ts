const fs = require('fs');

const IS_LOCAL = process.env.IS_LOCAL;

const localAssetsUrl = 'src/assets/';
const remoteAssetsUrl = 'https://raw.githubusercontent.com/maxzz/maxzz/master/src/assets/';
const assetsUrl = IS_LOCAL ? localAssetsUrl : remoteAssetsUrl;

const imageUrls = {
    mainImg: `![](${assetsUrl}main.svg)`,
    mainHiImg: `![](${assetsUrl}main-hi.svg)`,
    photeImg: `![](${assetsUrl}maxz-128.png)`,
};

function replaceChunk(content: string, marker: string, chunk: string) {
    const re = new RegExp(`<!\-\- ${marker} starts \-\->.*<!\-\- ${marker} ends \-\->`, 's');
    const newCnt = `<!-- ${marker} starts -->\n${chunk}\n<!-- ${marker} ends -->`;
    return content.replace(re, newCnt);
}

export function saveReadme(newCnt: string) {
    let cnt = fs.readFileSync('./src/assets/README-template.md').toString();

    cnt = cnt.replace(/\!\[\]\((\S*)src\/assets\/main\.svg\)/, imageUrls.mainImg);
    cnt = cnt.replace(/\!\[\]\((\S*)src\/assets\/main-hi\.svg\)/, imageUrls.mainHiImg);
    cnt = cnt.replace(/\!\[\]\((\S*)src\/assets\/maxz-128\.png\)/, imageUrls.photeImg);
    cnt = replaceChunk(cnt, 'recent_releases', newCnt);

    fs.writeFileSync('./README.md', cnt);
}
