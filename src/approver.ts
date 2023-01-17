import * as core from "@actions/core"
import { Octo, PartialWorkflowRun, WorkflowRun } from "./octo"

export async function findAndApproveDeployments(
  octo: Octo,
  repo: { owner: string; repo: string },
  actors_to_approve: string[],
  environments_to_approve: string[]
): Promise<void> {
  const waitingRunsResponse = await octo.getWaitingWorkflowRuns(repo)
  const runs: PartialWorkflowRun[] = validateRuns(
    waitingRunsResponse.data.workflow_runs
  )
  const deploysToApprove = await filterDeploymentsToApprove(
    runs,
    actors_to_approve,
    octo,
    repo,
    environments_to_approve
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
    await octo.approveDeployment(repo, run, deploy.environment)
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
  actors_to_approve: string[],
  octo: Octo,
  repo: { owner: string; repo: string },
  environments_to_approve: string[]
): Promise<DeployForApproval[]> {
  const filteredDeployPromises = runs.map(async (run) => {
    const actor = run.actor && run.actor.login
    if (!actors_to_approve.includes(actor)) {
      core.warning(
        `Run ${run.id} is pending approval, but from an un-allowed actor: ${actor}`
      )
      return null
    }

    core.info(
      `A run created by ${actor} is awaiting deployment: ${run.display_title}. Confirming that it is an expected environment and this user has permission to approve...`
    )
    const deploys = await octo.getPendingDeploymentsForRun(repo, run.id)
    if (!deploys || !deploys.data) {
      throw new Error(
        `could not retrieve deployments for run '${run.display_title}' (${run.id})`
      )
    }
    const approvable = deploys.data.filter((deploy) => {
      if (!deploy.environment.name) {
        throw new Error("expected environment to have name")
      }
      if (!environments_to_approve.includes(deploy.environment.name)) {
        core.warning(
          `Environment '${deploy.environment.name}' not approvable for run ${run.display_title}.`
        )
        return false
      }
      if (!deploy.current_user_can_approve) {
        core.error(
          `The current user does not have permission to approve deployment for environment '${deploy.environment.name}'.`
        )
        return false
      }
      return true
    })
    if (approvable.length > 0) {
      const deploy = approvable[0]
      core.info(
        `deploy for environment '${deploy.environment.name}' and run '${run.id}' will be approved...`
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
