A bot which allows users to reply to an issue with a comment to sign a petition.

To use this bot add the following workflow to your repo at `.github/workflows/honk.yml`:

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
        env:
          COMMITTER_TOKEN: ${{ secrets.COMMITTER_TOKEN }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

To see this in use, checkout [sign-test](https://github.com/jeffrafter/sign-test/issues/1).

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
npm install
npm run build
rm -rf node_modules
sed -i '' '/node_modules/d' .gitignore
npm install --production
git add .
git commit -m "V1"
git push origin releases/v1
git push origin :refs/tags/v1
git tag -fa v1 -m "V1"
git push origin v1
```

Once complete you'll likely want to remove the production node modules and reinstall the dev dependencies.

# Notes

Views are my own

# LICENCE

https://firstdonoharm.dev/

Copyright 2019 Jeff Rafter

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

- The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

- The Software may not be used by individuals, corporations, governments, or other groups for systems or activities that actively and knowingly endanger, harm, or otherwise threaten the physical, mental, economic, or general well-being of individuals or groups in violation of the United Nations Universal Declaration of Human Rights (https://www.un.org/en/universal-declaration-human-rights/).

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

This license is derived from the MIT License, as amended to limit the impact of the unethical use of open source software.
