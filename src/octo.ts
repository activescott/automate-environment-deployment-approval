// https://docs.github.com/en/rest/actions/workflow-runs#list-workflow-runs-for-a-repository
// https://docs.github.com/en/rest/actions/workflow-runs#review-pending-deployments-for-a-workflow-run
// https://docs.github.com/en/rest/deployments/statuses
// https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#status
// https://github.com/octokit/core.js
import { writeFile, mkdir } from "node:fs/promises"
import { Octokit } from "octokit"
import { components } from "@octokit/openapi-types"
import { Endpoints, RequestParameters } from "@octokit/types"
import * as core from "@actions/core"
import { ArrayElement } from "./utilityTypes"

export interface Octo {
  getWaitingWorkflowRuns(repo: Repo): Promise<GetWorkflowRunsResponse>
  getPendingDeploymentsForRun(
    repo: Repo,
    run_id: number
  ): Promise<PendingDeploymentsResponse>
  approveDeployment(
    repo: Repo,
    run: PartialWorkflowRun,
    environment: EnvironmentPartial
  ): Promise<
    Endpoints["POST /repos/{owner}/{repo}/actions/runs/{run_id}/pending_deployments"]["response"]
  >
}

export type PendingDeploymentsResponse =
  Endpoints["GET /repos/{owner}/{repo}/actions/runs/{run_id}/pending_deployments"]["response"]

type OctoKitPartial = Pick<Octokit, "request">

export type Repo = {
  owner: string
  repo: string
}

export function createOcto(repo: Repo, kit: OctoKitPartial): Octo {
  return new OctoImpl(repo, kit)
}

type OctoKitRequestResult<R extends keyof Endpoints> = Promise<
  Endpoints[R]["response"]
>

export type GetWorkflowRunsResponse =
  Endpoints["GET /repos/{owner}/{repo}/actions/runs"]["response"]

type WorkflowRunArray = GetWorkflowRunsResponse["data"]["workflow_runs"]

export type WorkflowRun = ArrayElement<WorkflowRunArray>

/** A WorkflowRun with the properties we need along with a partial actor */
export type PartialWorkflowRun = Pick<WorkflowRun, "display_title" | "id"> &
  HasActor

type SimpleUser = components["schemas"]["simple-user"]
/** The limited set of user properties we require */
export type PartialUser = Pick<SimpleUser, "login">

/**
 * An object with an actor that limits to the user props that we require.
 */
type HasActor = {
  actor: PartialUser
}

export type EnvironmentPartial = {
  id: number
  name: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RawData = any
class OctoImpl implements Octo {
  public constructor(private repo: Repo, private octokit: OctoKitPartial) {}

  public async getWaitingWorkflowRuns(
    repo: Repo
  ): Promise<GetWorkflowRunsResponse> {
    const runs = this.doRequest("GET /repos/{owner}/{repo}/actions/runs", {
      ...repo,
      status: "waiting",
    })
    return runs
  }

  public async getPendingDeploymentsForRun(
    repo: Repo,
    run_id: number
  ): Promise<
    Endpoints["GET /repos/{owner}/{repo}/actions/runs/{run_id}/pending_deployments"]["response"]
  > {
    const deploys = await this.doRequest(
      "GET /repos/{owner}/{repo}/actions/runs/{run_id}/pending_deployments",
      {
        ...repo,
        run_id: run_id,
      }
    )
    return deploys
  }

  public async approveDeployment(
    repo: Repo,
    run: PartialWorkflowRun,
    environment: EnvironmentPartial
  ): Promise<
    Endpoints["POST /repos/{owner}/{repo}/actions/runs/{run_id}/pending_deployments"]["response"]
  > {
    const actor: PartialUser = run.actor ? run.actor : { login: "UNKNOWN" }

    core.info(
      `Approving deployment to ${environment.name} triggered by ${actor.login} for run ${run.display_title}...`
    )
    const resp = await this.doRequest(
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
      `Approved deployment to ${environment.name} triggered by ${actor.login} for run ${run.display_title}.`
    )
    return resp
  }

  private async dumpResponse(
    method: "GET" | "POST" | "PUT" | string,
    pathAfterRepo: string,
    response: Promise<RawData> | RawData
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

  private async doRequest<TRoute extends keyof Endpoints>(
    route: TRoute,
    options?: Endpoints[TRoute]["parameters"] & RequestParameters
  ): OctoKitRequestResult<TRoute> {
    //TODO: figure out how to satisfy tsc on the options type below
    const result = await this.octokit.request(route, options)
    const MAX_PARTS = 2
    const [method, fullPath] = route.split(" ", MAX_PARTS)
    const path = fullPath.startsWith("/repos/{owner}/{repo}/")
      ? fullPath.substring("/repos/{owner}/{repo}/".length)
      : fullPath
    await this.dumpResponse(method, path, result)
    return result
  }
}
