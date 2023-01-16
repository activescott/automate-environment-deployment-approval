import * as core from "@actions/core"
import * as github from "@actions/github"
import { inspect } from "node:util"
import {
  getPendingDeploymentsForRun,
  getWaitingWorkflowRuns,
  approveDeployment,
} from "./octo"

async function run(): Promise<void> {
  try {
    const environments_to_approve: any = core.getMultilineInput(
      "environments_to_approve",
      { required: true }
    )
    core.info(
      `input environments_to_approve: ${inspect(environments_to_approve)}`
    )

    const actors_to_approve: any = core.getMultilineInput("actors_to_approve", {
      required: true,
    })
    core.info(`input actors_to_approve: ${inspect(actors_to_approve)}`)

    const repo = github.context.repo

    const waitingRunsResponse = await getWaitingWorkflowRuns(repo)
    const runs = waitingRunsResponse.data.workflow_runs
    const deploysToApprove = runs
      .map(async (run) => {
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
        const deploys = await getPendingDeploymentsForRun(repo, run.id)
        const approvable = deploys.data.filter((deploy) => {
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
            `Moving to approve deploy for environment '${deploy.environment}' for run '${run.id}'. `
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
      .filter((deploy) => deploy !== null)
    core.info(`Found ${deploysToApprove.length} deploys to approve.`)

    for await (const deploy of deploysToApprove) {
      if (!deploy) {
        // this case is actually prevented with the filter above, but tsc doesn't seem to get that :/
        throw Error("Unexpected null deploy")
      }
      await approveDeployment(repo, deploy.run, deploy.environment)
    }

    core.setOutput("time", new Date().toTimeString())
  } catch (err) {
    if (err instanceof Error) core.setFailed(err.message)
    throw err
  }
}

run()
