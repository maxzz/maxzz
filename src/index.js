const fs = require('fs');
const path = require('path');
global.fetch = require('node-fetch');
const GraphQLClient = require('graphql-request').GraphQLClient;
require('dotenv').config();

const makeQuery = (afterCursor) => {
    // https://developer.github.com/v4/object/repository/
    let query = /* GraphQL */ `
    query {
        viewer {
          repositories(first: 5, privacy: PUBLIC, after:${afterCursor ? `"${afterCursor}"` : 'null'}) {
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
};

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
}

function replaceChunk(content, marker, chunk) {
    let re = new RegExp(`<!\-\- ${marker} starts \-\->.*<!\-\- ${marker} ends \-\->`, 's');
    let newCnt = `<!-- ${marker} starts -->\n${chunk}\n<!-- ${marker} ends -->`;
    return content.replace(re, newCnt);
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

function formatRepos(repos) {
    repos = repos.sort(sortRepos);
    repos = repos.reverse();

    const lenRepo = 4; // 4 is length of 'Repo'.
    let maxName = repos.reduce((acc, cur) => cur.name.length > acc ? cur.name.length : acc, lenRepo);
    let padding = '&nbsp;'.repeat(maxName - lenRepo + 12); // for none monospace font

    let original = repos.filter(repo => !repo.isFork);
    let forked = repos.filter(repo => repo.isFork);

    //
    let newCnt = `\n## Original repositories\n\n`;
    newCnt += `Repo${padding} | created | updated\n-|-|-\n` + buildTable(original);
    newCnt += `\n\n## Collaboration repositories\n\n`;
    newCnt += `Repo${padding} | created | updated\n-|-|-\n` + buildTable(forked);

    return newCnt;

    function fmtDate(dateString) {
        let s = new Intl.DateTimeFormat('en-US').format(new Date(dateString));
        return s.split('/').map(_ => zeros(_, 2)).join('.');
    }
   
    function buildTable(repos) {
        return repos.map(repo => {
            const code = '```';
            return `[${repo.name}](${repo.url}) | ${code}${fmtDate(repo.createdAt)}${code} | ${code}${fmtDate(repo.updatedAt)}${code}`;
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

    let repos = await getRepos(MY_TOKEN);
    let newCnt = formatRepos(repos);

    // console.log('-----------------------------------------');
    // console.log(JSON.stringify(repos, null, 4));

    let cnt = fs.readFileSync('./README.md').toString();
    cnt = replaceChunk(cnt, 'recent_releases', newCnt);
    fs.writeFileSync('./README.md', cnt);
}

main().catch((error) => console.error(error));
