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
  [2, ActorsInTestData, EnvironmentsInTestData, []],
  [0, ActorsInTestData, EnvironmentsNotInTestData, ["1234"]],
  [0, ActorsNotInTestData, EnvironmentsInTestData, []],
  [0, ActorsNotInTestData, EnvironmentsNotInTestData, ["1234"]],
]
test.each(TEST_CASES)(
  "should approve %i deploys for actors '%s' and environments of '%s'",
  async (
    expectedApprovalCount: number | string[],
    actorAllowList: number | string[],
    environmentAllowList: number | string[],
    runIdAllowList: number | string[]
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
      environmentAllowList as string[],
      runIdAllowList as string[]
    )
    expect(octoStub.approveDeployment.callCount).toStrictEqual(
      expectedApprovalCount
    )
  }
)
