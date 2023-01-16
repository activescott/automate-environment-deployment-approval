// https://docs.github.com/en/rest/actions/workflow-runs#list-workflow-runs-for-a-repository
// https://docs.github.com/en/rest/actions/workflow-runs#review-pending-deployments-for-a-workflow-run
// https://docs.github.com/en/rest/deployments/statuses
// https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#status
// https://github.com/octokit/core.js
import { writeFile, mkdir } from "node:fs/promises"
import { Octokit } from "octokit"
import { Endpoints, RequestParameters } from "@octokit/types"
import * as core from "@actions/core"
import { ArrayElement } from "./type"

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
})

async function dumpResponse(
  method: "GET" | "POST" | "PUT" | string,
  pathAfterRepo: string,
  response: Promise<any> | any
): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    return
  }
  pathAfterRepo = pathAfterRepo.startsWith("/")
    ? pathAfterRepo
    : "/" + pathAfterRepo
  pathAfterRepo = pathAfterRepo.replace(/\//g, "-")
  await mkdir("./responses", { recursive: true })
  await writeFile(
    `./responses/${method}--repos-${pathAfterRepo}.json`,
    JSON.stringify(await response, null, "  ")
  )
}

type OctoKitRequestResult<R extends keyof Endpoints> = Promise<
  Endpoints[R]["response"]
>

async function doRequest<TRoute extends keyof Endpoints>(
  route: TRoute,
  options?: Endpoints[TRoute]["parameters"] & RequestParameters
): OctoKitRequestResult<TRoute> {
  const result = await octokit.request(route, options)
  const [method, fullPath] = route.split(" ", 2)
  const path = fullPath.startsWith("/repos/{owner}/{repo}/")
    ? fullPath.substring("/repos/{owner}/{repo}/".length)
    : fullPath
  await dumpResponse(method, path, result)
  return result
}

type Repo = {
  owner: string
  repo: string
}
export async function getWaitingWorkflowRuns(
  repo: Repo
): Promise<Endpoints["GET /repos/{owner}/{repo}/actions/runs"]["response"]> {
  const runs = doRequest("GET /repos/{owner}/{repo}/actions/runs", {
    ...repo,
    status: "waiting",
  })
  await dumpResponse("GET", `actions/runs`, runs)
  return runs
}

export async function getPendingDeploymentsForRun(repo: Repo, run_id: number) {
  const deploys = doRequest(
    "GET /repos/{owner}/{repo}/actions/runs/{run_id}/pending_deployments",
    {
      ...repo,
      run_id: run_id,
    }
  )
  return deploys
}

type WorkflowRunArray =
  Endpoints["GET /repos/{owner}/{repo}/actions/runs"]["response"]["data"]["workflow_runs"]
type WorkflowRun = ArrayElement<WorkflowRunArray>
type EnvironmentPartial = {
  id: number
  name: string
}

export async function approveDeployment(
  repo: Repo,
  run: Pick<WorkflowRun, "actor" | "display_title" | "id">,
  environment: EnvironmentPartial
) {
  core.error("skipping deployment approval")
  //return

  const actor = run.actor ? run.actor : "UNKNOWN"

  core.info(
    `Approving deployment to ${environment.name} triggered by ${actor} for run ${run.display_title}...`
  )
  await doRequest(
    "POST /repos/{owner}/{repo}/actions/runs/{run_id}/pending_deployments",
    {
      ...repo,
      run_id: run.id,
      environment_ids: [environment.id],
      state: "approved",
      comment: "approved by approve-dependabot-deploys script",
    }
  )
  core.notice(
    `Approved deployment to ${environment.name} triggered by ${actor} for run ${run.display_title}.`
  )
}
