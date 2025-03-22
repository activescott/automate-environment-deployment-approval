import * as core from "@actions/core"

export const ActionInputNames = {
  environment_allow_list: "environment_allow_list",
  actor_allow_list: "actor_allow_list",
  run_id_allow_list: "run_id_allow_list",
  github_token: "github_token",
}

/**
 * Returns the environment variable name to use for the given input
 * @example
 * process.env[getEnvironmentNameForInput("SKIP_APPROVALS_FOR_TESTING")] = "true"
 */
export function getEnvironmentNameForInput<
  TInputName extends keyof typeof ActionInputNames
>(inputName: TInputName): string {
  return `INPUT_${ActionInputNames[inputName].toUpperCase()}`
}

export function setInputValueInEnvironment<
  TInputName extends keyof typeof ActionInputNames
>(inputName: TInputName, value: string): void {
  process.env[getEnvironmentNameForInput(inputName)] = value
}

export function deleteInputValueInEnvironment<
  TInputName extends keyof typeof ActionInputNames
>(inputName: TInputName): void {
  delete process.env[getEnvironmentNameForInput(inputName)]
}

export function getMultilineInput<
  TInputName extends keyof typeof ActionInputNames
>(inputName: TInputName, isRequired: boolean = true): string[] {
  return core.getMultilineInput(inputName, { required: isRequired })
}

export function getStringInput<
  TInputName extends keyof typeof ActionInputNames
>(inputName: TInputName, isRequired: boolean = true): string {
  return core.getInput(inputName, { required: isRequired })
}
