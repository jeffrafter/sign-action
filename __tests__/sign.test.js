"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const github = __importStar(require("@actions/github"));
const nock_1 = __importDefault(require("nock"));
const sign_1 = __importDefault(require("../sign"));
beforeEach(() => {
    jest.resetModules();
    process.env['GITHUB_REPOSITORY'] = 'example/repository';
    process.env['GITHUB_TOKEN'] = '12345';
    process.env['INPUT_FILE-TO-SIGN'] = '__tests__/no-tech-for-ice.md';
    process.env['INPUT_ISSUE-NUMBER'] = '1';
    process.env['INPUT_ALPHABETIZE'] = 'yes';
    // https://developer.github.com/v3/activity/events/types/#issuecommentevent
    github.context.payload = {
        action: 'created',
        issue: {
            number: 1,
        },
        comment: {
            id: 1,
            user: {
                login: 'monalisa',
            },
            body: 'Mona Lisa',
        },
    };
});
describe('sign action', () => {
    it('runs', async () => {
        const sha = 'abcdef';
        const content = 'Immigration and Customs Enforcement (ICE) is now able to conduct mass scale deportations because of newly acquired technology that allows them to monitor and track people like never before.\n\n<!-- signatures -->\n* Jeff Rafter, @jeffrafter\n* Mona Lisa, @monalisa\n';
        // get ref
        nock_1.default('https://api.github.com')
            .get('/repos/example/repository/git/refs/heads/master')
            .reply(200, {
            object: {
                sha: sha,
            },
        });
        // get the tree
        nock_1.default('https://api.github.com')
            .get(`/repos/example/repository/git/trees/${sha}`)
            .reply(200, {
            tree: [{ path: '__tests__/no-tech-for-ice.md' }],
        });
        // post the tree
        const treeSha = 'abc456';
        nock_1.default('https://api.github.com')
            .post(`/repos/example/repository/git/trees`, body => {
            return (body.base_tree === sha &&
                body.tree[0].path === '__tests__/no-tech-for-ice.md' &&
                body.tree[0].mode === '100644' &&
                body.tree[0].type === 'blob' &&
                body.tree[0].content === content);
        })
            .reply(200, {
            sha: treeSha,
        });
        // create commit
        const commitSha = 'abc789';
        nock_1.default('https://api.github.com')
            .post(`/repos/example/repository/git/commits`, body => {
            return body.message === 'Add @monalisa' && body.tree === treeSha && body.parents[0] === sha;
        })
            .reply(200, {
            sha: commitSha,
        });
        // update ref
        nock_1.default('https://api.github.com')
            .patch(`/repos/example/repository/git/refs/heads/master`, body => {
            return body.sha === commitSha;
        })
            .reply(200, {
            sha: commitSha,
        });
        await sign_1.default();
    });
});
