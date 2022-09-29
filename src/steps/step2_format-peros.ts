export function formatRepos(repos: any[]) {
    repos = repos.sort(sortRepos);
    repos = repos.reverse();

    let forked = repos.filter(repo => repo.isFork);
    let original = moveRepoReadmeToEnd(repos.filter(repo => !repo.isFork));

    let paddingColumnRepo = columnRepoPadding(); // Padding to keep width of column 'repo' the same for upper and lower tables.
    let paddingColumnHome = columnHomePadding(); // Padding to keep width of column 'home' the same for upper and lower tables.

    // Original repos
    let newCnt = `\n## Original repositories\n\n`;
    newCnt += `repo${paddingColumnRepo} | created | updated | home${paddingColumnHome}\n-|-|-|-\n` + buildTable(original);

    // Collaboration repos
    newCnt += `\n\n## Collaboration repositories\n\n`;
    newCnt += `repo${paddingColumnRepo} | created | updated | home${paddingColumnHome}\n-|-|-|-\n` + buildTable(forked);

    return newCnt;

    function moveRepoReadmeToEnd(original: any[]) {
        let readme = /^(?:maxzz)/i;
        let readmes: any[] = [];
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

    function columnLength(repos: any[], minLength: number, column: string) {
        let max = repos.reduce((acc, cur) => cur[column].length > acc ? cur[column].length : acc, minLength);
        return max;
    }

    function columnRepoPadding() {
        const lenRepo = 4; // 4 is the length of word 'Repo'
        let maxName = columnLength(repos, lenRepo, 'name');
        let padding = '&nbsp;'.repeat(maxName - lenRepo + 20); // +20 for none monospace font
        return padding;
    }

    function columnHomePadding() {
        const lenRepo = 4; // 4 is the length of word 'Home'
        let maxName = 'npm packge'.length; // This is max lenght of column 'home' (to keep it simple).
        let padding = '&nbsp;'.repeat(maxName - lenRepo + 5); // +5 for none monospace font
        return padding;
    }

    function sortRepos(repoA: any, repoB: any) {
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
    
    function fmtDate(dateString: string) {
        let s = new Intl.DateTimeFormat('en-US').format(new Date(dateString));
        return s.split('/').map(_ => zeros(_, 2)).join('.');
    }

    function repoDemoPage(repo: any) {
        if (repo.homepageUrl) {
            return `[${/npmjs\.com/.test(repo.homepageUrl) ? 'npm' : 'demo'}](${repo.homepageUrl})`;
        }
        const meta: Record<string, string> = {
            'ch-spy-ext': 'extension',
            'spawn-loading-test': 'tests',
            'quadratic-curves': 'WIP',
            'server-ocr': 'study',
            'gradients': 'study',
            'rardir': 'npm packge',
            'netsh-rule': 'npm packge',
            'react-lifecycles': 'study',
            'giffy': 'TODO',
            'gluehtml': 'npm packge',
            'test-graphql': 'study',
            'maxzz-proxy': 'server',
            'maxzz-python': 'study',
            'maxzz': 'this page',

            'http-wrapper-example': 'utility',
            'myFlix': 'TODO',
            'VueSolitaire': 'TODO',
            'har-extractor': 'npm packge',
            'ace-builds': 'editor',
            'tanx-1': 'TODO',
            'ThreeJSEditorExtension': 'extension',
        };
        return meta[repo.name] || 'WIP';
    }
   
    function buildTable(repos: any[]) {
        return repos.map(repo => {
            const code = '```';
            return `[${repo.name}](${repo.url}) | ${code}${fmtDate(repo.createdAt)}${code} | ${code}${fmtDate(repo.updatedAt)}${code} | ${repoDemoPage(repo)}`;
        }).join('\n');
    }

    function zeros(v: string | number, total: number) {
        // Returns v prefixed with '0's with length <= total or v as is.
        v = v ? '' + v : '';
        return v.length < total ? '0000000000'.slice(0, total - v.length) + v : v;
    }
}
