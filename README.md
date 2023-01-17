<p align="center">
  <a href="https://github.com/activescott/automate-environment-deployment-approval/actions"><img alt="typescript-action status" src="https://github.com/activescott/automate-environment-deployment-approval/workflows/build-test/badge.svg"></a>
</p>

# Automate Approval of Deployments to Github Environments

Use this action to automate approval of deployments to Github environments.

## Create an Workflow

```yaml
name: Deployment Auto-Approver
# using triggers for every deployment and allowed manually
# docs on these triggers:
# https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#deployment
# https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#workflow_dispatch
on: [deployment, workflow_dispatch]

jobs:
  auto_approve:
    runs-on: ubuntu-latest
    steps:
      - name: Auto Approve Deploys
        uses: activescott/automate-environment-deployment-approval@main
        with:
          github_token: ${{ secrets.GH_TOKEN_FOR_AUTO_APPROVING_DEPLOYS }}
          environment_allow_list: |
            aws
          # e.g. "dependabot[bot]"
          actor_allow_list: |
            dependabot[bot]
            activescott
```

## Development of this Action

> First, you'll need to have a reasonably modern version of `node` handy. This won't work with versions older than 9, for instance.

Install the dependencies

```sh
npm install
```

Build the typescript and package it for distribution

```sh
npm run build && npm run package
```

Run the tests :heavy_check_mark:

```sh
npm test
```

## Change action.yml

The action.yml defines the inputs and output for your action.

Update the action.yml with your name, description, inputs and outputs for your action.

See the [documentation](https://help.github.com/en/articles/metadata-syntax-for-github-actions)

## Change the Code

Most toolkit and CI/CD operations involve async operations so the action is run in an async function.

```javascript
import * as core from '@actions/core';
...

async function run() {
  try {
      ...
  }
  catch (error) {
    core.setFailed(error.message);
  }
}

run()
```

See the [toolkit documentation](https://github.com/actions/toolkit/blob/master/README.md#packages) for the various packages.

## Publish to a distribution branch

Actions are run from GitHub repos so we will checkin the packed dist folder.

Then run [ncc](https://github.com/zeit/ncc) and push the results:

```bash
$ npm run package
$ git add dist
$ git commit -a -m "prod dependencies"
$ git push origin releases/v1
```

Note: We recommend using the `--license` option for ncc, which will create a license file for all of the production node modules used in your project.

Your action is now published! :rocket:

See the [versioning documentation](https://github.com/actions/toolkit/blob/master/docs/action-versioning.md)

## Validate

You can now validate the action by referencing `./` in a workflow in your repo (see [test.yml](.github/workflows/test.yml))

```yaml
uses: ./
with:
  milliseconds: 1000
```

See the [actions tab](https://github.com/actions/typescript-action/actions) for runs of this action! :rocket:

## Usage:

After testing you can [create a v1 tag](https://github.com/actions/toolkit/blob/master/docs/action-versioning.md) to reference the stable and latest V1 action
