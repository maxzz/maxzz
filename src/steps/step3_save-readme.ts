const fs = require('fs');

const IS_LOCAL = process.env.IS_LOCAL;

const localRepoUrl = 'src/assets/';
const remoteRepoUrl = 'https://raw.githubusercontent.com/maxzz/maxzz/master/src/assets/';

const imageUrls = {
    mainImg: IS_LOCAL
        ? '![](src/assets/main.svg)'
        : `![](${remoteRepoUrl}main.svg)`,
    mainHiImg: IS_LOCAL
        ? '![](src/assets/main-hi.svg)'
        : `![](${remoteRepoUrl}main-hi.svg)`,
    photeImg: IS_LOCAL
        ? '![](src/assets/maxz-128.png)'
        : `![](${remoteRepoUrl}maxz-128.png)`,
};

function replaceChunk(content: string, marker: string, chunk: string) {
    let re = new RegExp(`<!\-\- ${marker} starts \-\->.*<!\-\- ${marker} ends \-\->`, 's');
    let newCnt = `<!-- ${marker} starts -->\n${chunk}\n<!-- ${marker} ends -->`;
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
