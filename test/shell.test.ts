import { describe, test, afterEach, before } from "mocha";
import { spy, restore, assert } from "sinon";
import yargs from "yargs/yargs";
import { temporaryWrite } from "tempy";
import mockStd from "mock-stdin";
import * as mod from "../src/commands/shell.js";
import { wait } from "../src/utils.js";

describe("commands/read", function () {

  test("Something", async function () {
    const consoleLog = spy(console, "log");
    const stdin = mockStd.stdin();
    process.nextTick(() => {
      stdin.send("select * from\n").send("healtbot_31337_1;").end();
    });
    await yargs(["shell", "--chain", "local-tableland", "--format", "objects"])
      .command(mod)
      .parse();
    assert.calledWith(
      consoleLog,
      `[
  {
    "counter": 1
  }
]`
    );
  });

});
