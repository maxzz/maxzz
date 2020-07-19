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
    var a = repoA.updatedAt;
    var b = repoB.updatedAt;
    if (a < b) {
        return -1;
    }
    if (a > b) {
        return 1;
    }
    return 0;
}

async function main() {
    const MY_TOKEN = process.env.MAXZZ_TOKEN;

    let repos = await getRepos(MY_TOKEN);
    repos = repos.sort(sortRepos);
    repos = repos.reverse();
    let newCnt = `<pre>\n${JSON.stringify(repos, null, 4)}\n</pre>\n`;

    // console.log('-----------------------------------------');
    // console.log(JSON.stringify(repos, null, 4));

    let cnt = fs.readFileSync('./README.md').toString();
    cnt = replaceChunk(cnt, 'recent_releases', newCnt);
    fs.writeFileSync('./README.md', cnt);
}

main().catch((error) => console.error(error));
