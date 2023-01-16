import * as core from "@actions/core"
import { inspect } from "node:util"

async function run(): Promise<void> {
  try {
    const environments_to_approve: any = core.getInput(
      "environments_to_approve",
      { required: true }
    )
    core.info(
      `input environments_to_approve: ${inspect(environments_to_approve)}`
    )

    const actors_to_approve: any = core.getInput("actors_to_approve", {
      required: true,
    })
    core.info(`input actors_to_approve: ${inspect(actors_to_approve)}`)

    core.setOutput("time", new Date().toTimeString())
  } catch (err) {
    if (err instanceof Error) core.setFailed(err.message)
    throw err
  }
}

run()
