import { createOcto, EnvironmentPartial } from "./octo"
import { randomInteger } from "./numbers"
import { createOctoKitStub, TestRepo } from "./testUtils"

test("approveDeployment", async () => {
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

test.todo("getPendingDeploymentsForRun")

test.todo("getWaitingWorkflowRuns")
