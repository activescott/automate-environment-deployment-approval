import { findAndApproveDeployments } from "./approver"
import { createOcto, Octo } from "./octo"
import * as github from "@actions/github"

/**
 * This is used to test live scenarios against activescott/serverless-aws-static-file-handler
 * Run it like this:
 * GITHUB_TOKEN=ghp_... npm run test -- debug
 */
test.skip("debug serverless-aws-static-file-handler", async () => {
  if (process.env.GITHUB_TOKEN === undefined) {
    throw new Error(
      "A GITHUB_TOKEN environment variable must be defined with a valid github token"
    )
  }
  const repo = {
    owner: "activescott",
    repo: "serverless-aws-static-file-handler",
  }
  const octo: Octo = createOcto(
    repo,
    github.getOctokit(process.env.GITHUB_TOKEN)
  )
  await findAndApproveDeployments(octo, repo, ["DONT APPROVE"], ["aws"], [""])
})
