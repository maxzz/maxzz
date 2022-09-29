const GraphQLClient = require('graphql-request').GraphQLClient;

export type Repo = {
    name: string;               // 'ThreeJSEditorExtension'
    url: string;                // 'https://github.com/maxzz/ThreeJSEditorExtension'
    createdAt: string;          // '2016-01-11T03:07:12Z'
    updatedAt: string;          // '2016-01-11T03:07:13Z'
    pushedAt: string;           // Identifies when the repository was last pushed to. //https://docs.github.com/en/graphql/reference/objects#repository
    isFork: boolean;            // true
    homepageUrl: string | null; // null
}

function makeQuery(afterCursor: string): string {
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
              pushedAt
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

export async function getRepos(token: string): Promise<Repo[]> {
    const endpoint = 'https://api.github.com/graphql';

    const graphQLClient = new GraphQLClient(endpoint, {
        headers: {
            authorization: `Bearer ${token}`,
        },
    });

    let repos: Repo[] = [];
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

/*
https://docs.github.com/en/graphql/overview/explorer
query {
    viewer {
        repositories(first: 100, privacy: PUBLIC, after:null) {
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
*/