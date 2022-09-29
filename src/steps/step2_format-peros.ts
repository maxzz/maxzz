import { Repo } from "./step1_get-repos";

function moveRepoReadmeToEnd(original: Repo[]): Repo[] {
    let readme = /^(?:maxzz)/i;
    let readmes: Repo[] = [];
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

function columnLength(repos: Repo[], minLength: number, column: keyof Omit<Repo, 'isFork'>): number {
    const max = repos.reduce((acc, cur) => {
        const currentLength = cur[column]?.length || 0;
        return currentLength > acc ? currentLength : acc;
    }, minLength);
    return max;
}

function columnRepoPadding(repos: Repo[]): string {
    const lenRepo = 4; // 4 is the length of word 'Repo'
    let maxName = columnLength(repos, lenRepo, 'name');
    let padding = '&nbsp;'.repeat(maxName - lenRepo + 20); // +20 for none monospace font
    return padding;
}

function columnHomePadding(): string {
    const lenRepo = 4; // 4 is the length of word 'Home'
    let maxName = 'npm packge'.length; // This is max lenght of column 'home' (to keep it simple).
    let padding = '&nbsp;'.repeat(maxName - lenRepo + 5); // +5 for none monospace font
    return padding;
}

function sortRepos(repoA: Repo, repoB: Repo): 0 | 1 | -1 {
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

function fmtDate(dateString: string): string {
    let s = new Intl.DateTimeFormat('en-US').format(new Date(dateString));
    return s.split('/').map(_ => zeros(_, 2)).join('.');
}

function repoDemoPage(repo: Repo): string {
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

function buildTable(repos: Repo[]): string {
    return repos.map(repo => {
        const code = '```';
        return `[${repo.name}](${repo.url}) | ${code}${fmtDate(repo.createdAt)}${code} | ${code}${fmtDate(repo.updatedAt)}${code} | ${repoDemoPage(repo)}`;
    }).join('\n');
}

function zeros(v: string | number, total: number): string {
    // Returns v prefixed with '0's with length <= total or v as is.
    v = v ? '' + v : '';
    return v.length < total ? '0000000000'.slice(0, total - v.length) + v : v;
}

export function formatRepos(repos: Repo[]): string {
    repos = repos.sort(sortRepos);
    repos = repos.reverse();

    let forked = repos.filter(repo => repo.isFork);
    let original = moveRepoReadmeToEnd(repos.filter(repo => !repo.isFork));

    let paddingColumnRepo = columnRepoPadding(repos); // Padding to keep width of column 'repo' the same for upper and lower tables.
    let paddingColumnHome = columnHomePadding(); // Padding to keep width of column 'home' the same for upper and lower tables.

    // Original repos
    let newCnt = `\n## Original repositories\n\n`;
    newCnt += `repo${paddingColumnRepo} | created | updated | home${paddingColumnHome}\n-|-|-|-\n` + buildTable(original);

    // Collaboration repos
    newCnt += `\n\n## Collaboration repositories\n\n`;
    newCnt += `repo${paddingColumnRepo} | created | updated | home${paddingColumnHome}\n-|-|-|-\n` + buildTable(forked);

    return newCnt;
}
