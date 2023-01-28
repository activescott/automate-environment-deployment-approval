import * as process from "process"
import * as cp from "child_process"
import * as path from "path"
import { expect, test } from "@jest/globals"
import { getEnvironmentNameForInput } from "./inputs"

/* eslint-disable no-magic-numbers,no-console */

// shows how the runner will run a javascript action with env / stdout protocol
test("basic main run", async () => {
  const env = {
    ...process.env,
  }
  env[getEnvironmentNameForInput("environment_allow_list")] = "prod\ndev"
  env[getEnvironmentNameForInput("actor_allow_list")] = "vanusha\nmisha"
  // this is normally injected by github actions host into the environment for actions
  env["GITHUB_TOKEN"] = "not-an-actual-token"
  env["GITHUB_REPOSITORY"] = "my-owner/my-repo"
  env["DEBUG_SKIP_ALL_REQUESTS"] = "1"

  const nodePath = process.execPath
  const codePath = path.join(__dirname, "..", "lib", "src", "main.js")
  const options: cp.ExecFileSyncOptions = {
    env: env,
  }
  const execResult: Buffer = cp.execFileSync(
    nodePath,
    [codePath],
    options
  ) as Buffer
  const output = execResult.toString()
  console.log(output)
  expect(output).toMatch(
    /^::warning::Skipping all requests since DEBUG_SKIP_ALL_REQUESTS found/m
  )
})
