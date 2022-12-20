import { describe, test } from "mocha";
import { spy, assert } from "sinon";
import yargs from "yargs/yargs";
import mockStd from "mock-stdin";
import { getAccounts } from "@tableland/local";
import * as mod from "../src/commands/shell.js";

describe("commands/read", function () {
  test("Something", async function () {
    const consoleLog = spy(console, "log");
    const stdin = mockStd.stdin();

    setTimeout(() => {
      stdin.send("select * from\n").send("healthbot_31337_1;").end();
    }, 1000);

    const [account] = getAccounts();
    const privateKey = account.privateKey.slice(2);
    await yargs([
      "shell",
      "--chain",
      "local-tableland",
      "--format",
      "objects",
      "--privateKey",
      privateKey,
    ])
      .command(mod)
      .parse();

    assert.match(
      consoleLog.getCall(4).args[0],
      `{
  "columns": [
    {
      "name": "counter"
    }
  ],
  "rows": [
    [
      1
    ]
  ]
}`
    );
  });
});
