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
          repositories(first: 100, privacy: PUBLIC, after:${afterCursor ? `"${afterCursor}"` : 'null'}) {
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
}

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

async function main() {
    const MY_TOKEN = process.env.MAXZZ_TOKEN;

    let repos = await getRepos(MY_TOKEN);

    console.log('-----------------------------------------');
    console.log(JSON.stringify(repos, null, 4));
}

main().catch((error) => console.error(error));
