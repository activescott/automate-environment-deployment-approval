import * as sinon from "sinon"
import { findAndApproveDeployments } from "./approver"
import { createOcto, Octo, Repo } from "./octo"
import {
  createOctoKitStub,
  TestRepo,
  getWaitingWorkflowRunsResponseTestData,
  getPendingDeploymentsForRunTestData,
  EnvironmentsInTestData,
  ActorsNotInTestData,
  ActorsInTestData,
  EnvironmentsNotInTestData,
} from "./testUtils"

/* eslint-disable no-magic-numbers,no-console */

const TEST_CASES = [
  [ActorsInTestData, EnvironmentsInTestData, 2],
  [ActorsInTestData, EnvironmentsNotInTestData, 0],
  [ActorsNotInTestData, EnvironmentsInTestData, 0],
  [ActorsNotInTestData, EnvironmentsNotInTestData, 0],
]
test.each(TEST_CASES)(
  "should conditionally approve based on environment_allow_list and actor_allow_list",
  async (
    actorAllowList: number | string[],
    environmentAllowList: number | string[],
    expectedApprovalCount: number | string[]
  ) => {
    const kitStub = createOctoKitStub()
    const octo: Octo = createOcto(TestRepo, kitStub)
    const octoStub = sinon.stub(octo)
    octoStub.getWaitingWorkflowRuns.resolves(
      getWaitingWorkflowRunsResponseTestData()
    )
    octoStub.getPendingDeploymentsForRun.callsFake((repo: Repo, id: number) => {
      return Promise.resolve(getPendingDeploymentsForRunTestData(id))
    })

    await findAndApproveDeployments(
      octoStub,
      TestRepo,
      actorAllowList as string[],
      environmentAllowList as string[]
    )
    expect(octoStub.approveDeployment.callCount).toStrictEqual(
      expectedApprovalCount
    )
  }
)
