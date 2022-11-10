import { describe, test, afterEach, before } from "mocha";
import { spy, restore, assert, match } from "sinon";
import yargs from "yargs/yargs";
import { temporaryWrite } from "tempy";
import mockStd from "mock-stdin";
import { getAccounts } from "@tableland/local";
import * as mod from "../src/commands/write.js";
import { wait } from "../src/utils.js";

describe("commands/write", function () {
  this.timeout("30s");

  before(async function () {
    await wait(500);
  });

  afterEach(function () {
    restore();
  });

  test("throws without privateKey", async function () {
    const consoleError = spy(console, "error");
    await yargs(["write", "blah"]).command(mod).parse();
    assert.calledWith(
      consoleError,
      "missing required flag (`-k` or `--privateKey`)"
    );
  });

  test("throws with invalid chain", async function () {
    const [account] = getAccounts();
    const privateKey = account.privateKey.slice(2);
    const consoleError = spy(console, "error");
    await yargs([
      "write",
      "insert into fake_31337_1 values (1, 2, 3);",
      "--privateKey",
      privateKey,
    ])
      .command(mod)
      .parse();
    assert.calledWith(
      consoleError,
      "unsupported chain (see `chains` command for details)"
    );
  });

  test("throws with invalid statement", async function () {
    const [account] = getAccounts();
    const privateKey = account.privateKey.slice(2);
    const consoleError = spy(console, "error");
    await yargs([
      "write",
      "invalid",
      "--chain",
      "local-tableland",
      "--privateKey",
      privateKey,
      "--no-rpcRelay",
    ])
      .command(mod)
      .parse();
    assert.calledWith(
      consoleError,
      "calling ValidateWriteQuery: validating query: unable to parse the query: syntax error at position 7 near 'invalid'"
    );
  });

  test("throws with missing file", async function () {
    const [account] = getAccounts();
    const privateKey = account.privateKey.slice(2);
    const consoleError = spy(console, "error");
    await yargs([
      "write",
      "--file",
      "missing.sql",
      "--chain",
      "local-tableland",
      "--privateKey",
      privateKey,
    ])
      .command(mod)
      .parse();
    assert.calledWith(
      consoleError,
      "ENOENT: no such file or directory, open 'missing.sql'"
    );
  });

  test("throws with empty stdin", async function () {
    const [account] = getAccounts();
    const privateKey = account.privateKey.slice(2);
    const stdin = mockStd.stdin();
    const consoleError = spy(console, "error");
    process.nextTick(() => {
      stdin.send("\n").end();
    });
    await yargs([
      "write",
      "--chain",
      "local-tableland",
      "--privateKey",
      privateKey,
    ])
      .command(mod)
      .parse();
    assert.calledWith(
      consoleError,
      "missing input value (`statement`, `file`, or piped input from stdin required)"
    );
  });

  test("passes with local-tableland", async function () {
    const [account] = getAccounts();
    const privateKey = account.privateKey.slice(2);
    const consoleLog = spy(console, "log");
    await yargs([
      "write",
      "update healthbot_31337_1 set counter=1 where rowid=0;", // This just updates in place
      "--chain",
      "local-tableland",
      "--privateKey",
      privateKey,
      "--no-rpcRelay",
    ])
      .command(mod)
      .parse();
    assert.calledWith(
      consoleLog,
      match(function (value: string) {
        const { hash, link } = JSON.parse(value);
        return typeof hash === "string" && hash.startsWith("0x") && !link;
      }, "does not match")
    );
  });

  test("passes when provided input from file", async function () {
    const [account] = getAccounts();
    const privateKey = account.privateKey.slice(2);
    const consoleLog = spy(console, "log");
    const path = await temporaryWrite(
      "update healthbot_31337_1 set counter=1;\n"
    );
    await yargs([
      "write",
      "--chain",
      "local-tableland",
      "--file",
      path,
      "--privateKey",
      privateKey,
      "--no-rpcRelay",
    ])
      .command(mod)
      .parse();
    assert.calledWith(
      consoleLog,
      match(function (value: string) {
        const { hash, link } = JSON.parse(value);
        return typeof hash === "string" && hash.startsWith("0x") && !link;
      }, "does not match")
    );
  });

  test("passes when provided input from stdin", async function () {
    const [account] = getAccounts();
    const privateKey = account.privateKey.slice(2);
    const consoleLog = spy(console, "log");
    const stdin = mockStd.stdin();
    process.nextTick(() => {
      stdin.send("update healthbot_31337_1 set counter=1;\n").end();
    });
    await yargs([
      "write",
      "--chain",
      "local-tableland",
      "--privateKey",
      privateKey,
      "--providerUrl",
      "http://localhost:8545", // Also test providerUrl
      "--no-rpcRelay", // The default for local-tableland is true here
    ])
      .command(mod)
      .parse();
    assert.calledWith(
      consoleLog,
      match(function (value: string) {
        const { hash, link } = JSON.parse(value);
        return typeof hash === "string" && hash.startsWith("0x") && !link;
      }, "does not match")
    );
  });
});