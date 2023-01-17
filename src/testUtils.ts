import * as sinon from "sinon"
import { Octokit } from "octokit"
import WaitingWorkflowRunsJson from "../test-data/GET-repos-owner-repo-actions-runs.json"
import PendingDeploymentsForRunTestData3927176162 from "../test-data/GET-repos-owner-repo-actions-runs-3927176162-pending_deployments.json"
import PendingDeploymentsForRunTestData3616268941 from "../test-data/GET-repos-owner-repo-actions-runs-3616268941-pending_deployments.json"
import { GetWorkflowRunsResponse, PendingDeploymentsResponse } from "./octo"

type OctokitStub = sinon.SinonStubbedInstance<InstanceType<typeof Octokit>>

export function createOctoKitStub(): OctokitStub {
  const GITHUB_TOKEN = "notarealtoken"
  const kit = new Octokit({
    auth: GITHUB_TOKEN,
  })
  const kitStub = sinon.stub(kit)
  return kitStub
}

export const TestRepo = {
  owner: "my-test-owner",
  repo: "my-test-repo",
}

/** These are in the underlying test data. Use them to approve the deploys */
export const ActorsInTestData = ["dependabot[bot]", "activescott"]
/** These are in the underlying test data. Use them to approve the deploys */
export const EnvironmentsInTestData = ["aws"]

/** These are NOT in the underlying test data. Use them to skip the deploys */
export const ActorsNotInTestData = ["vanusha", "misha"]
/** These are NOT in the underlying test data. Use them to skip the deploys */
export const EnvironmentsNotInTestData = ["gcp", "doesntexist"]

export function getWaitingWorkflowRunsResponseTestData(): GetWorkflowRunsResponse {
  return WaitingWorkflowRunsJson as GetWorkflowRunsResponse
}

export function getPendingDeploymentsForRunTestData(
  run_id: number
): PendingDeploymentsResponse {
  /* eslint-disable no-magic-numbers */
  if (run_id === 3927176162) {
    return PendingDeploymentsForRunTestData3927176162 as PendingDeploymentsResponse
  } else if (run_id === 3616268941) {
    return PendingDeploymentsForRunTestData3616268941 as PendingDeploymentsResponse
  } else {
    // eslint-disable-next-line no-console
    console.error(
      "Unexpected workflow run_id in getPendingDeploymentsForRunTestData",
      run_id
    )
    return {
      status: 200,
      url: "",
      headers: {},
      data: [],
    } as PendingDeploymentsResponse
  }
}
