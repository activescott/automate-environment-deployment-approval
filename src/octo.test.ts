import { createOcto, EnvironmentPartial } from "./octo"
import { randomInteger } from "./numbers"
import { createOctoKitStub, TestRepo } from "./testUtils"

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

test.todo("getWaitingWorkflowRuns should call kit")

test("currentUser should call kit", async () => {
  const kitStub = createOctoKitStub()
  kitStub.request.resolves({
    headers: {},
    status: 200,
    url: "foo",
    // NOTE: incomplete, but we can get away with it...
    data: { login: "foo" },
  })
  const octo = createOcto(TestRepo, kitStub)
  const user = await octo.currentUser()
  expect(user).toHaveProperty("login")
  expect(kitStub.request.callCount).toEqual(1)
})

test("currentUser should gracefully handle failures", async () => {
  const kitStub = createOctoKitStub()
  kitStub.request.rejects()
  const octo = createOcto(TestRepo, kitStub)
  const user = await octo.currentUser()
  expect(user).toHaveProperty("login")
})
