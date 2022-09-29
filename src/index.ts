global.fetch = require('node-fetch');
require('dotenv').config();

import { formatRepos } from "./steps/step2_format-peros";
import { getRepos, Repo } from "./steps/step1_get-repos";
import { saveReadme } from "./steps/step3_save-readme";

async function main() {
    const MY_TOKEN = process.env.MAXZZ_TOKEN || '';

    // 1. Prepare the new content
    let repos: Repo[] = await getRepos(MY_TOKEN);
    let newCnt: string = formatRepos(repos);

    // 2. Update README.md
    saveReadme(newCnt);

    console.log('all done');
}

main().catch((error) => {
    console.error(error);
    return -1;
});
