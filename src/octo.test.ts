import { createOcto, EnvironmentPartial } from "./octo"
import { randomInteger } from "./numbers"
import {
  createOctoKitStub,
  getWaitingWorkflowRunsResponseTestData,
  TestRepo,
} from "./testUtils"

/* eslint-disable no-magic-numbers,no-console */

test("approveDeployment should call octokit", async () => {
  const kitStub = createOctoKitStub()
  kitStub.request.resolves({
    headers: {},
    status: 200,
    url: "foo",
    data: "foo",
  })
  const octo = createOcto(TestRepo, kitStub)
  const testRun = {
    actor: {
      login: "foo",
    },
    display_title: "",
    id: randomInteger(),
  }
  const testEnv: EnvironmentPartial = {
    id: randomInteger(),
    name: "my-env",
  }
  await octo.approveDeployment(TestRepo, testRun, testEnv)
  expect(kitStub.request.callCount).toEqual(1)
  const calledWithArgs = kitStub.request.args[0]
  const calledWithOptions = calledWithArgs[1]
  expect(calledWithOptions).toHaveProperty("run_id", testRun.id)
})

test.todo("getPendingDeploymentsForRun should call kit")

test("getWaitingWorkflowRuns should call kit", async () => {
  const kitStub = createOctoKitStub()
  kitStub.request.resolves(getWaitingWorkflowRunsResponseTestData())
  const octo = createOcto(TestRepo, kitStub)
  const result = await octo.getWaitingWorkflowRuns(TestRepo)

  expect(result.data).toHaveProperty("total_count", 2)
  expect(result.data.workflow_runs).toHaveProperty("length", 2)
  expect(result.data.workflow_runs[0]).toHaveProperty("id")
  expect(result.data.workflow_runs[1]).toHaveProperty("id")
})

test("currentUser should have login", async () => {
  const kitStub = createOctoKitStub()
  const octo = createOcto(TestRepo, kitStub)
  const user = await octo.currentUser()
  expect(user).toHaveProperty("login")
})

test("currentUser should gracefully handle failures", async () => {
  const kitStub = createOctoKitStub()
  kitStub.request.rejects()
  const octo = createOcto(TestRepo, kitStub)
  const user = await octo.currentUser()
  expect(user).toHaveProperty("login")
})
