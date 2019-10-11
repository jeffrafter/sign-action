An action which allows users to reply to an issue with a comment to sign a petition.

Users responding to an issue with a comment will automatically sign the petition:

![Example signature](https://user-images.githubusercontent.com/4064/66619936-90964d80-eb93-11e9-9237-f299eaf9f018.png)

The action creates a new commit with the content of their comment and their user name:

```
* Jeff Rafter, @jeffrafter
```

To use this action add the following workflow to your repo at `.github/workflows/sign.yml`:

```yml
name: Sign Petition
on:
  issue_comment:
    types: [created]

jobs:
  build:
    name: Sign Petition
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v1
        with:
          fetch-depth: 1
      - uses: jeffrafter/sign-action@v1
        with:
          file-to-sign: README.md
          issue-number: 1
          alphabetize: yes
        env:
          COMMITTER_TOKEN: ${{ secrets.COMMITTER_TOKEN }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

- `file-to-sign` - points to the file that you would like to add signatures to (defaults to `README.md`)
- `issue-number` - limit comment processing to a single issue (defaults to 1; if empty all issue comments are treated as signatures)
- `alphabetize` - if yes, all sinatures will be alphabetized by user name (defaults to `yes`)

Your petition should take the format:

    Immigration and Customs Enforcement (ICE) is now able to conduct
    mass scale deportations because of newly acquired technology that
    allows them to monitor and track people like never before.

    Signed,

    <!-- signatures -->
    * Jeff Rafter, @jeffrafter

Note that the `<!-- signatures -->` marker is required.

To see this in use, checkout [sign-test](https://github.com/jeffrafter/sign-test/issues/1).

## Branch protections

If you want to use the `COMMITTER_TOKEN` you have to [generate a personal access token](https://github.com/settings/tokens). This allows you to add branch-protections to protect master while still allowing the action to commit.

![Adding a secret COMMITTER_TOKEN](https://user-images.githubusercontent.com/4064/66620040-f4207b00-eb93-11e9-91c1-6b1c270050d3.png)

## Development

Clone this repo. Then run tests:

```bash
npm test
```

And lint:

```
npm run lint
```

If you want to release a new version first checkout or create the release branch

```
git checkout releases/v1
```

Then build the distribution (requires compiling the TypeScript), drop the node modules and reinstall only the production node modules, commit and push the tag:

```bash
git reset --hard master
rm -rf node_modules
npm install
npm run build
rm -rf node_modules
sed -i '' '/node_modules/d' .gitignore
npm install --production
git add .
git commit -m "V1"
git push -f origin releases/v1
git push origin :refs/tags/v1
git tag -fa v1 -m "V1"
git push origin v1
```

Once complete you'll likely want to remove the production node modules and reinstall the dev dependencies.

# Notes

This action does not do any moderation of the signatures.

Views are my own, unfortunately.

# LICENCE

https://firstdonoharm.dev/

Copyright 2019 Jeff Rafter

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

- The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

- The Software may not be used by individuals, corporations, governments, or other groups for systems or activities that actively and knowingly endanger, harm, or otherwise threaten the physical, mental, economic, or general well-being of individuals or groups in violation of the United Nations Universal Declaration of Human Rights (https://www.un.org/en/universal-declaration-human-rights/).

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

This license is derived from the MIT License, as amended to limit the impact of the unethical use of open source software.
