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
})
