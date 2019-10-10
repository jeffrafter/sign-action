import * as core from '@actions/core'
import * as github from '@actions/github'
import * as fs from 'fs'
import * as path from 'path'
import {GitCreateTreeParamsTree} from '@octokit/rest'

interface TreeEntry {
  path?: string
}

const run = async (): Promise<void> => {
  try {
    const token = process.env['COMMITTER_USER_TOKEN'] || process.env['GITHUB_TOKEN']
    if (!token) return

    // Create the octokit client
    const octokit: github.GitHub = new github.GitHub(token)
    const nwo = process.env['GITHUB_REPOSITORY'] || '/'
    const [owner, repo] = nwo.split('/')
    const issue = github.context.payload['issue']
    if (!issue) return

    const comment = github.context.payload.comment
    const commentBody = comment.body
    const commentAuthor = comment.user.login

    // If the comment is not the single word "Sign" we won't do anything
    if (!commentBody.match(/^sign$/i)) return
    console.log(`Signing for ${commentAuthor}!`)

    // Grab the ref for a branch (master in this case)
    // If you already know the sha then you don't need to do this
    // https://developer.github.com/v3/git/refs/#get-a-reference
    const ref = 'heads/master'
    const refResponse = await octokit.git.getRef({
      owner,
      repo,
      ref,
    })
    const sha = refResponse.data.object.sha
    console.log({sha})

    // Grab the current tree so we can see the list of paths
    // https://developer.github.com/v3/git/trees/#get-a-tree-recursively
    const baseTreeResponse = await octokit.git.getTree({
      owner,
      repo,
      tree_sha: sha,
    })
    const paths: Array<string> = baseTreeResponse.data.tree.map((item: TreeEntry) => {
      return item.path
    })
    console.log({paths})

    // Keep track of the entries for this commit
    const tree: Array<GitCreateTreeParamsTree> = []

    // Grab the file we are adding the signature to
    const workspace = process.env['GITHUB_WORKSPACE'] || './'
    const fileToSign = core.getInput('file-to-sign')
    const fileToSignPath = path.join(workspace, fileToSign)
    let content = fs.readFileSync(fileToSignPath).toString('utf-8')

    // TODO: allow other kinds of signatures
    const signature = `@${commentAuthor}`

    // Is the signature already there?
    const re = new RegExp(`^${signature}$`, 'gm')
    if (content.match(re)) {
      console.log(`${commentAuthor} already signed!`)
      return
    }

    // Make sure there is a newline
    if (content !== '' && !content.endsWith('\n')) content += '\n'

    // Put together the content with the signatures added
    // TODO: alphabetize (possibly just using a sort on a subset of lines)?
    content += `${signature}\n`

    // Push the contents
    tree.push({
      path: fileToSign,
      mode: '100644',
      type: 'blob',
      content: content,
    })

    // Create the tree using the collected tree entries
    // https://developer.github.com/v3/git/trees/#create-a-tree
    const treeResponse = await octokit.git.createTree({
      owner,
      repo,
      base_tree: sha,
      tree: tree,
    })
    console.log({treeResponse: treeResponse.data})

    // Commit that tree
    // https://developer.github.com/v3/git/commits/#create-a-commit
    const message = `Add @${commentAuthor}`
    const commitResponse = await octokit.git.createCommit({
      owner,
      repo,
      message,
      tree: treeResponse.data.sha,
      parents: [sha],
    })
    console.log(`Commit complete: ${commitResponse.data.sha}`)

    // The commit is complete but it is unreachable
    // We have to update master to point to it
    // https://developer.github.com/v3/git/refs/#update-a-reference
    const updateRefResponse = await octokit.git.updateRef({
      owner,
      repo,
      ref: 'heads/master',
      sha: commitResponse.data.sha,
      force: false,
    })
    console.log({updateRefResponse: updateRefResponse.data})
    console.log('Done')

    // TODO: add a reaction to the comment
  } catch (error) {
    console.error(error.message)
    core.setFailed(`Failure: ${error}`)
  }
}

run()

export default run
