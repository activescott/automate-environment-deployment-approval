import * as core from "@actions/core"
import { inspect } from "node:util"
import { Octo, PartialWorkflowRun, WorkflowRun } from "./octo"

export async function findAndApproveDeployments(
  octo: Octo,
  repo: { owner: string; repo: string },
  actorAllowList: string[],
  environmentAllowList: string[]
): Promise<void> {
  const waitingRunsResponse = await octo.getWaitingWorkflowRuns(repo)
  const runs: PartialWorkflowRun[] = validateRuns(
    waitingRunsResponse.data.workflow_runs
  )
  const deploysToApprove = await filterDeploymentsToApprove(
    runs,
    actorAllowList,
    octo,
    repo,
    environmentAllowList
  )
  core.notice(
    `Found ${deploysToApprove.length} deploys that should be approved...`
  )

  for await (const deploy of deploysToApprove) {
    if (!deploy) {
      // this case is actually prevented with prior filtering, but tsc doesn't seem to get that :/
      throw Error("Unexpected null deploy")
    }
    if (!deploy.run.actor) {
      throw new Error("WorkflowRun has no actor")
    }
    const run = deploy.run as PartialWorkflowRun
    const actor = run.actor
    const environment = deploy.environment
    try {
      core.info(
        `Approving deployment to ${environment.name} triggered by ${actor.login} for run ${run.display_title}...`
      )
      await octo.approveDeployment(repo, run, deploy.environment)
      core.notice(
        `Approved deployment to ${environment.name} triggered by ${actor.login} for run ${run.display_title}.`
      )
    } catch (err) {
      const msg = `Failed to approve deployment for run '${
        run.display_title
      }' (${run.id}) to environment '${
        deploy.environment.name
      }'. The current user is '${await octo.currentUser()}' and the error was: ${err}`
      core.setFailed(msg)
    }
  }
}

type DeployForApproval = {
  environment: {
    name: string
    id: number
  }
  run: PartialWorkflowRun
}

/** Converts the type from the REST API to something we work with internally. Essentially there are some partials and nullable members from the API that we fix up here */
function validateRuns(rawRuns: WorkflowRun[]): PartialWorkflowRun[] {
  const mapped = rawRuns.map((run) => {
    if (!run.actor) {
      throw new Error("expected run to always have an actor")
    }
    return {
      ...run,
      actor: { login: run.actor.login },
    }
  })
  return mapped
}

async function filterDeploymentsToApprove(
  runs: PartialWorkflowRun[],
  actorAllowList: string[],
  octo: Octo,
  repo: { owner: string; repo: string },
  environmentAllowList: string[]
): Promise<DeployForApproval[]> {
  const filteredDeployPromises = runs.map(async (run) => {
    const actor = run.actor && run.actor.login
    if (!actorAllowList.includes(actor)) {
      core.warning(
        `Run '${run.display_title}' (${
          run.id
        }) has a deployment pending approval but the actor '${actor}' is not allowed. Allowed actors are '${inspect(
          actorAllowList
        )}' and are specified in the \`actor_allow_list\` input.`
      )
      return null
    }
    const deploys = await octo.getPendingDeploymentsForRun(repo, run.id)
    const currentUser = await octo.currentUser()
    const approvable = deploys.data.filter((deploy) => {
      if (!deploy.environment.name) {
        throw new Error("expected environment to have name")
      }
      if (!environmentAllowList.includes(deploy.environment.name)) {
        core.warning(
          `Run '${run.display_title}' (${
            run.id
          }) has a deployment pending approval but it is not to an allowed environment: '${
            deploy.environment.name
          }'. Allowed environments are ${inspect(
            environmentAllowList
          )} and are specified in the \`environment_allow_list\` input.`
        )
        return false
      }
      if (!deploy.current_user_can_approve) {
        core.warning(
          `The current user (${currentUser.login}) cannot approve deployment for run '${run.display_title}' (${run.id}) to environment '${deploy.environment.name}'. The github_token input determines the current user and it must be from a 'required reviewer' and must have the 'repo' scope. See https://github.com/activescott/automate-environment-deployment-approval#token-permissions-permissions for more information.`
        )
        // This WILL fail later if we allow it to continue and doesn't have any better error information (only 'HttpError: Validation Failed')
        return false
      }
      return true
    })
    if (approvable.length > 0) {
      const deploy = approvable[0]
      core.info(
        `Deployment '${run.display_title}' (${run.id}) to environment '${deploy.environment.name}' will be approved...`
      )
      if (!deploy.environment.name) {
        throw new Error("environment does not have name")
      }
      if (!deploy.environment.id) {
        throw new Error("environment does not have id")
      }
      return {
        environment: {
          name: deploy.environment.name,
          id: deploy.environment.id,
        },
        run,
      }
    } else {
      return null
    }
  })
  // note that these can be promises:
  const filteredDeploys = await Promise.all(filteredDeployPromises)
  return filteredDeploys.filter(
    (deploy) => deploy != null
  ) as DeployForApproval[]
}
