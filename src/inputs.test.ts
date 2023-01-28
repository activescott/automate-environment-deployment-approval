import * as inputs from "./inputs"
import { randomInteger } from "./numbers"

describe("input", () => {
  afterEach(() => {
    for (const key of Object.keys(inputs.ActionInputNames)) {
      inputs.deleteInputValueInEnvironment(
        key as unknown as keyof typeof inputs.ActionInputNames
      )
    }
  })

  test("setInputValueInEnvironment should set the environment", () => {
    const KEY_VALUE = "mykey" + randomInteger()
    inputs.setInputValueInEnvironment("github_token", KEY_VALUE)
    expect(process.env["INPUT_GITHUB_TOKEN"]).toEqual(KEY_VALUE)
  })

  test("getStringInput", () => {
    const expected = `testactor-${randomInteger()}`
    inputs.setInputValueInEnvironment("actor_allow_list", expected)
    const actual = inputs.getStringInput("actor_allow_list")
    expect(actual).toEqual(expected)
  })

  test("getMultilineInput", () => {
    const expected = `line-one\nline-two`
    inputs.setInputValueInEnvironment("actor_allow_list", expected)
    const actual = inputs.getMultilineInput("actor_allow_list")
    expect(actual).toEqual(["line-one", "line-two"])
  })
})
