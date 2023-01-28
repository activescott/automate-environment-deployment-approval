import * as core from "@actions/core"
import * as github from "@actions/github"
import { inspect } from "node:util"
import { findAndApproveDeployments } from "./approver"
import { getMultilineInput } from "./inputs"
import { Octo, createOcto } from "./octo"

async function run(): Promise<void> {
  try {
    const environments_to_approve = getMultilineInput("environment_allow_list")
    core.info(
      `input environments_to_approve: ${inspect(environments_to_approve)}`
    )

    const actors_to_approve = getMultilineInput("actor_allow_list")
    core.info(`input actors_to_approve: ${inspect(actors_to_approve)}`)

    const github_token = process.env["GITHUB_TOKEN"]
    if (!github_token) {
      // my understanding is that the environment should always be there: https://docs.github.com/en/actions/security-guides/automatic-token-authentication
      throw new Error("The GITHUB_TOKEN environment variable was not found.")
    }

    const repo = github.context.repo
    const octo: Octo = createOcto(repo, github.getOctokit(github_token))

    if (!Reflect.has(process.env, "DEBUG_SKIP_ALL_REQUESTS")) {
      await findAndApproveDeployments(
        octo,
        repo,
        actors_to_approve,
        environments_to_approve
      )
    } else {
      core.warning("Skipping all requests since DEBUG_SKIP_ALL_REQUESTS found")
    }
  } catch (err) {
    if (err instanceof Error) core.setFailed(err.message)
    throw err
  }
}

run()
