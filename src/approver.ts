import { inspect } from "node:util"
import * as trace from "./trace"
import { setFailed } from "@actions/core"
import { Octo, PartialWorkflowRun, WorkflowRun } from "./octo"

export async function findAndApproveDeployments(
  octo: Octo,
  repo: { owner: string; repo: string },
  actorAllowList: string[],
  environmentAllowList: string[],
  runIdAllowList: string[]
): Promise<void> {
  trace.debug("Fetching runs for repo:", repo)
  const waitingRunsResponse = await octo.getWaitingWorkflowRuns(repo)
  trace.debug(
    "Found %s waiting runs as follows: ",
    waitingRunsResponse.data.total_count,
    waitingRunsResponse.data.workflow_runs.map((run) => run.display_title)
  )
  const runs: PartialWorkflowRun[] = validateRuns(
    waitingRunsResponse.data.workflow_runs
  )
  const deploysToApprove = await filterDeploymentsToApprove(
    runs,
    actorAllowList,
    octo,
    repo,
    environmentAllowList,
    runIdAllowList
  )
  trace.notice(
    "Found %d deploys that should be approved...",
    deploysToApprove.length
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
      trace.info(
        "Approving deployment to %s triggered by %s for run %s...",
        environment.name,
        actor.login,
        run.display_title
      )
      await octo.approveDeployment(repo, run, deploy.environment)
      trace.notice(
        "Approved deployment to %s triggered by %s for run %s.",
        environment.name,
        actor.login,
        run.display_title
      )
    } catch (err) {
      const msg = `Failed to approve deployment for run '${
        run.display_title
      }' (${run.id}) to environment '${
        deploy.environment.name
      }'. The current user is '${await octo.currentUser()}' and the error was: ${err}`
      setFailed(msg)
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
  environmentAllowList: string[],
  runIdAllowList: string[]
): Promise<DeployForApproval[]> {
  trace.debug(
    "Filtering the following workflow runs:",
    runs.map((run) => `#${run.id}: ${run.display_title}}`)
  )
  const filteredDeployPromises = runs.map(async (run) => {
    const actor = run.actor && run.actor.login
    if (actorAllowList.length > 0 && !actorAllowList.includes(actor)) {
      trace.warning(
        "Run '%s (%s)' has a deployment pending approval but the actor '%s' is not allowed. Allowed actors are '%O' and are specified in the `actor_allow_list` input.",
        run.display_title,
        run.id,
        actor,
        actorAllowList
      )
      return null
    }
    if (
      runIdAllowList.length > 0 &&
      !runIdAllowList.includes(run.id.toString())
    ) {
      trace.warning(
        "Run '%s (%s)' has a deployment pending approval but the run ID '%s' is not allowed. Allowed run IDs are '%O' and are specified in the `run_id_allow_list` input.",
        run.display_title,
        run.id,
        run.id,
        runIdAllowList
      )
      return null
    }
    const deploys = await octo.getPendingDeploymentsForRun(repo, run.id)
    trace.debug(
      "Found the following deploys for workflow run: " +
        inspect(deploys.data.map((deploy) => deploy.environment.name))
    )
    const currentUser = await octo.currentUser()
    const approvable = deploys.data.filter((deploy) => {
      if (!deploy.environment.name) {
        throw new Error("expected environment to have name")
      }
      if (!environmentAllowList.includes(deploy.environment.name)) {
        trace.warning(
          "Run '%s' (%s) has a deployment pending approval but it is not to an allowed environment: '%s'. Allowed environments are '%O' and are specified in the `environment_allow_list` input.",
          run.display_title,
          run.id,
          deploy.environment.name,
          environmentAllowList
        )
        return false
      }
      if (!deploy.current_user_can_approve) {
        trace.warning(
          "The current user (%s) cannot approve deployment for run '%s' (%s) to environment '%s'. The github_token input determines the current user and it must be from a 'required reviewer' and must have the 'repo' scope. See https://github.com/activescott/automate-environment-deployment-approval#token-permissions-permissions for more information.",
          currentUser.login,
          run.display_title,
          run.id,
          deploy.environment.name
        )
        // This WILL fail later if we allow it to continue and doesn't have any better error information (only 'HttpError: Validation Failed')
        return false
      }
      return true
    })
    if (approvable.length > 0) {
      const deploy = approvable[0]
      trace.info(
        `Deployment '%s' (%s) to environment '%s' will be approved...`,
        run.display_title,
        run.id,
        deploy.environment.name
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
