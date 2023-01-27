<p align="center">
  <a href="https://github.com/activescott/automate-environment-deployment-approval/actions"><img alt="typescript-action status" src="https://github.com/activescott/automate-environment-deployment-approval/workflows/build-test/badge.svg"></a>
</p>

# Automate Approval of Deployments to Github Environments

Use this action to automatically approve workflow jobs that reference an environment with a "Required reviewers" protection rule. The action has two settings:

- `environment_allow_list` specifies which environments to automatically approve deployments to.
- `actor_allow_list` specifies which users/actors triggering a deployment that should be automatically approved.

An deployment must be both to an environment in the `environment_allow_list` AND from an actor in `actor_allow_list` or it will _not_ be automatically approved and instead will require manual review as described in [Github's Reviewing deployments](https://docs.github.com/en/actions/managing-workflow-runs/reviewing-deployments) help article.

For more information on general use of Github Environments and using them for deployments in Github Actions see [Github's Using environments for deployment](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment) article.

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
        # you can use any @vN.N.N tag from https://github.com/activescott/automate-environment-deployment-approval/releases
        uses: activescott/automate-environment-deployment-approval@v1.0.0
        with:
          github_token: ${{ secrets.GH_TOKEN_FOR_AUTO_APPROVING_DEPLOYS }}
          environment_allow_list: |
            aws
          # the below automatically approves dependabot and anything submitted by the Github user with login "activescott"
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

See the [toolkit documentation](https://github.com/actions/toolkit/blob/master/README.md#packages) for the various packages.

## Release Process (Deploying to NPM)

We use [semantic-release](https://github.com/semantic-release/semantic-release) to consistently release [semver](https://semver.org/)-compatible versions. This project deploys to production as well as pre-release releases to Github. Each of the below branches correspond to the following release/pre-release status:

| branch | release or pre-release |
| ------ | ---------------------- |
| main   | production             |
| beta   | pre-release            |

To trigger a release use a Conventional Commit following [Angular Commit Message Conventions](https://github.com/angular/angular.js/blob/master/DEVELOPERS.md#-git-commit-guidelines) on one of the above branches.
