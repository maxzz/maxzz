const fs = require('fs');
const path = require('path');
global.fetch = require('node-fetch');
const GraphQLClient = require('graphql-request').GraphQLClient;
require('dotenv').config();

async function getRepos(token) {
    const endpoint = 'https://api.github.com/graphql';

    const graphQLClient = new GraphQLClient(endpoint, {
        headers: {
            authorization: `Bearer ${token}`,
        },
    });

    let repos = [];
    let hasNextPage = true;
    let endCursor = '';

    while (hasNextPage) {
        let query = makeQuery(endCursor);
        let data = await graphQLClient.request(query);

        repos.push(...data.viewer.repositories.nodes);

        // console.log('-----------------------------------------');
        // console.log(JSON.stringify(data, null, 4));
        hasNextPage = data.viewer.repositories.pageInfo.hasNextPage;
        endCursor = data.viewer.repositories.pageInfo.endCursor;
    }

    return repos;

    function makeQuery(afterCursor) {
        // https://developer.github.com/v4/object/repository/
        let query = /* GraphQL */ `
        query {
            viewer {
              repositories(first: 25, privacy: PUBLIC, after:${afterCursor ? `"${afterCursor}"` : 'null'}) {
                pageInfo {
                  hasNextPage
                  endCursor
                }
                nodes {
                  name
                  url
                  createdAt
                  updatedAt
                  isFork
                  homepageUrl
                  # description
          
                  # releases(last:1) {
                  #   totalCount
                  #   nodes {
                  #     name
                  #     publishedAt
                  #     url
                  #   }
                  # }
                }
              }
            }
          }
        `;
        return query;
    }
}

function replaceChunk(content, marker, chunk) {
    let re = new RegExp(`<!\-\- ${marker} starts \-\->.*<!\-\- ${marker} ends \-\->`, 's');
    let newCnt = `<!-- ${marker} starts -->\n${chunk}\n<!-- ${marker} ends -->`;
    return content.replace(re, newCnt);
}

function formatRepos(repos) {
    repos = repos.sort(sortRepos);
    repos = repos.reverse();

    let forked = repos.filter(repo => repo.isFork);
    let original = moveRepoReadmeToEnd(repos.filter(repo => !repo.isFork));

    let padding = tablePadding(); // Padding to keep width of upper and lower tables the same.

    // Original repos
    let newCnt = `\n## Original repositories\n\n`;
    newCnt += `repo${padding} | created | updated | home\n-|-|-|-\n` + buildTable(original);

    // Collaboration repos
    newCnt += `\n\n## Collaboration repositories\n\n`;
    newCnt += `repo${padding} | created | updated | home\n-|-|-|-\n` + buildTable(forked);

    return newCnt;

    function moveRepoReadmeToEnd(original) {
        let readme = /^(?:maxzz)/i;
        let readmes = [];
        original = original.filter(repo => {
            let isReadme = readme.test(repo.name);
            if (isReadme) {
                readmes.push(repo);
            }
            return !isReadme;
        });
        readmes = readmes.reverse();
        original.push(...readmes);
        return original;
    }

    function tablePadding() {
        const lenRepo = 4; // 4 is the length of word 'Repo'.
        let maxName = repos.reduce((acc, cur) => cur.name.length > acc ? cur.name.length : acc, lenRepo);
        let padding = '&nbsp;'.repeat(maxName - lenRepo + 20); // for none monospace font
        return padding;
    }

    function sortRepos(repoA, repoB) {
        const a = repoA.updatedAt;
        const b = repoB.updatedAt;
        if (a < b) {
            return -1;
        }
        if (a > b) {
            return 1;
        }
        return 0;
    }
    
    function fmtDate(dateString) {
        let s = new Intl.DateTimeFormat('en-US').format(new Date(dateString));
        return s.split('/').map(_ => zeros(_, 2)).join('.');
    }

    function buildTable(repos) {
        return repos.map(repo => {
            const code = '```';
            const demo = repo.homepageUrl ? `[demo](${repo.homepageUrl})` : '';
            return `[${repo.name}](${repo.url}) | ${code}${fmtDate(repo.createdAt)}${code} | ${code}${fmtDate(repo.updatedAt)}${code} | ${demo}`;
        }).join('\n');
    }

    function zeros(v/*: string | number*/, total/*: number*/) {
        // Returns v prefixed with '0's with length <= total or v as is.
        v = v ? '' + v : '';
        return v.length < total ? '0000000000'.slice(0, total - v.length) + v : v;
    }
}

async function main() {
    const MY_TOKEN = process.env.MAXZZ_TOKEN;
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

    // 1. Prepare the new content
    let repos = await getRepos(MY_TOKEN);
    let newCnt = formatRepos(repos);

    // 2. Update README.md
    let cnt = fs.readFileSync('./src/assets/README-template.md').toString();
    cnt = cnt.replace(/\!\[\]\((\S*)src\/assets\/main\.svg\)/, mainImg);
    cnt = cnt.replace(/\!\[\]\((\S*)src\/assets\/main-hi\.svg\)/, mainHiImg);
    cnt = cnt.replace(/\!\[\]\((\S*)src\/assets\/maxz-128\.png\)/, photeImg);
    cnt = replaceChunk(cnt, 'recent_releases', newCnt);
    fs.writeFileSync('./README.md', cnt);
}

main().catch((error) => console.error(error));
