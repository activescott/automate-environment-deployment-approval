import * as process from "process"
import * as cp from "child_process"
import * as path from "path"
import { expect, test } from "@jest/globals"
import { writeFile } from "node:fs/promises"

/* eslint-disable no-magic-numbers,no-console */

// shows how the runner will run a javascript action with env / stdout protocol
test("test runs", async () => {
  process.env["INPUT_ENVIRONMENTS_TO_APPROVE"] = "prod\ndev"
  process.env["INPUT_ACTORS_TO_APPROVE"] = "vanusha\nmisha"

  const nodePath = process.execPath
  const codePath = path.join(__dirname, "..", "lib", "main.js")
  const options: cp.ExecFileSyncOptions = {
    env: process.env,
  }
  const execResult: Buffer = cp.execFileSync(nodePath, [codePath], options) as Buffer
  const output = execResult.toString()
  console.log(output)
  // expect core.setOutput("time", ...)
  expect(output).toMatch(/^::set-output\s+name=time::/m)
})
