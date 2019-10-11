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
    const token = process.env['COMMITTER_TOKEN'] || process.env['GITHUB_TOKEN']
    if (!token) return

    // Create the octokit client
    const octokit: github.GitHub = new github.GitHub(token)
    const nwo = process.env['GITHUB_REPOSITORY'] || '/'
    const [owner, repo] = nwo.split('/')
    const issue = github.context.payload['issue']
    if (!issue) return

    const comment = github.context.payload.comment
    const commentBody = comment.body.trim()
    const commentAuthor = comment.user.login

    // Is this limited to an issue number?
    const expectedIssueNumber = core.getInput('issue-number')
    if (expectedIssueNumber && expectedIssueNumber !== '' && expectedIssueNumber !== `${issue.number}`) {
      console.log(`Comment for unexpected issue number ${issue.number}, not signing`)
      return
    }

    // Only match comments with single line word chars
    // Including "." and "-" for hypenated names and honorifics
    // Name must start with a word char
    if (!commentBody.match(/^\w[.\w\- ]+$/i)) return
    console.log(`Signing ${commentBody} for ${commentAuthor}!`)

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
    let [letter, signatures] = content.split('<!-- signatures -->')
    if (!signatures) {
      console.log('No <!-- signatures --> marker found. Please add a signatures marker to your document')
    }

    // Is the signature already there?
    const re = new RegExp(`^\\* .* @${commentAuthor}$`, 'gm')
    if (signatures.match(re)) {
      console.log(`We're confused, there is already a signature for ${commentAuthor}`)
      return
    }

    // Make sure there is a newline
    signatures = signatures.trim()
    if (signatures !== '' && !signatures.endsWith('\n')) signatures += '\n'

    // Put together the content with the signatures added
    const signature = `${commentBody}, @${commentAuthor}`
    signatures += `* ${signature}\n`

    // Sort the lines alphabetically by handle
    if (core.getInput('alphabetize') === 'yes') {
      console.log('Alphabetizing the signatures by user name')
      const signatureLines = signatures.trim().split('\n')
      signatureLines.sort((a: string, b: string) => {
        const handleA = a.match(/@.+$/)
        const handleB = b.match(/@.+$/)
        if (!handleA) return -1
        if (!handleB) return 1
        return handleA == handleB ? 0 : handleA < handleB ? -1 : 1
      })
      signatures = signatureLines.join('\n')
      signatures += `\n`
    }

    // Join the pieces
    letter = `${letter}<!-- signatures -->\n`
    content = `${letter}${signatures}`

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
