import * as core from "@actions/core"
import * as github from "@actions/github"
import { inspect } from "node:util"
import { findAndApproveDeployments } from "./approver"
import { getMultilineInput, getStringInput } from "./inputs"
import { Octo, createOcto } from "./octo"

async function run(): Promise<void> {
  try {
    const environments_to_approve = getMultilineInput("environment_allow_list")
    core.info(
      `input environments_to_approve: ${inspect(environments_to_approve)}`
    )

    const actors_to_approve = getMultilineInput("actor_allow_list", false)
    core.info(`input actors_to_approve: ${inspect(actors_to_approve)}`)

    const run_ids_to_approve = getMultilineInput("run_id_allow_list", false)
    core.info(`input run_ids_to_approve: ${inspect(run_ids_to_approve)}`)

    // Check if at least one of the inputs is filled
    if (actors_to_approve.length === 0 && run_ids_to_approve.length === 0) {
      throw new Error(
        "At least one of the inputs must be provided: actor_allow_list or run_id_allow_list"
      )
    }

    const github_token: string = getStringInput("github_token")

    const repo = github.context.repo
    const octo: Octo = createOcto(repo, github.getOctokit(github_token))

    if (!Reflect.has(process.env, "DEBUG_SKIP_ALL_REQUESTS")) {
      await findAndApproveDeployments(
        octo,
        repo,
        actors_to_approve,
        environments_to_approve,
        run_ids_to_approve
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
