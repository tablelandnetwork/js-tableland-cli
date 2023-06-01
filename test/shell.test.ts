import { equal, match } from "node:assert";
import { describe, test } from "mocha";
import { spy, restore, stub, assert } from "sinon";
import yargs from "yargs/yargs";
import mockStd from "mock-stdin";
import { getAccounts } from "@tableland/local";
import * as mod from "../src/commands/shell.js";
import { wait, logger } from "../src/utils.js";
import { ethers } from "ethers";
import { getResolverMock } from "./mock.js";

describe("commands/shell", function () {
  this.timeout("30s");

  before(async function () {
    await wait(10000);
  });

  afterEach(function () {
    restore();
  });

  test("Shell Works with single line", async function () {
    const consoleLog = spy(logger, "log");
    const stdin = mockStd.stdin();

    setTimeout(() => {
      stdin.send("select * from healthbot_31337_1;\n").end();
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

    const value = consoleLog.getCall(3).args[0];
    equal(value, '[{"counter":1}]');
  });

  test("ENS in shell with single line", async function () {
    const fullResolverStub = stub(
      ethers.providers.JsonRpcProvider.prototype,
      "getResolver"
    ).callsFake(getResolverMock);

    const consoleLog = spy(logger, "log");
    const stdin = mockStd.stdin();

    setTimeout(() => {
      stdin.send("select * from [foo.bar.eth];\n").end();
    }, 2000);

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
      "--enableEnsExperiment",
      "--ensProviderUrl",
      "http://localhost:8545",
    ])
      .command(mod)
      .parse();

    fullResolverStub.reset();

    const call4 = consoleLog.getCall(4);
    equal(call4.args[0], '[{"counter":1}]');
  });

  test("ENS in shell with backtics", async function () {
    const fullResolverStub = stub(
      ethers.providers.JsonRpcProvider.prototype,
      "getResolver"
    ).callsFake(getResolverMock);

    const consoleLog = spy(logger, "log");
    const stdin = mockStd.stdin();

    setTimeout(() => {
      stdin.send("select * from `foo.bar.eth`;\n").end();
    }, 2000);

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
      "--enableEnsExperiment",
      "--ensProviderUrl",
      "http://localhost:8545",
    ])
      .command(mod)
      .parse();

    fullResolverStub.reset();

    const call4 = consoleLog.getCall(4);
    equal(call4.args[0], '[{"counter":1}]');
  });

  test("ENS in shell with double quotes", async function () {
    const fullResolverStub = stub(
      ethers.providers.JsonRpcProvider.prototype,
      "getResolver"
    ).callsFake(getResolverMock);

    const consoleLog = spy(logger, "log");
    const stdin = mockStd.stdin();

    setTimeout(() => {
      stdin.send(`select * from "foo.bar.eth";\n`).end();
    }, 2000);

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
      "--enableEnsExperiment",
      "--ensProviderUrl",
      "http://localhost:8545",
    ])
      .command(mod)
      .parse();

    fullResolverStub.reset();

    const value = consoleLog.getCall(4).args[0];
    equal(value, '[{"counter":1}]');
  });

  test("Shell Works with initial input", async function () {
    const consoleLog = spy(logger, "log");
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
      "SELECT * FROM healthbot_31337_1;",
    ])
      .command(mod)
      .parse();

    const value = consoleLog.getCall(3).args[0];
    equal(value, '[{"counter":1}]');
  });

  test("Shell handles invalid query", async function () {
    const consoleError = spy(logger, "error");
    const stdin = mockStd.stdin();

    setTimeout(() => {
      stdin.send("select non_existent_table;\n").end();
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

    const value = consoleError.getCall(0).args[0] as string;
    match(value, /error parsing statement/);
  });

  test("Write queries continue with 'y' input", async function () {
    const consoleLog = spy(logger, "log");
    const stdin = mockStd.stdin();

    setTimeout(() => {
      stdin.send("CREATE TABLE sometable (id integer, message text);\n");
      setTimeout(() => {
        stdin.send("y\n");
      }, 500);
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

    const value = consoleLog.getCall(4).args[0];
    match(value, /"createdTable":/);
    match(value, /sometable_31337_\d+/);
  });

  test("Write queries aborts with 'n' input", async function () {
    const consoleLog = spy(logger, "log");
    const stdin = mockStd.stdin();

    setTimeout(() => {
      stdin.send("CREATE TABLE SomeTable (id integer, message text);\n");
      setTimeout(() => {
        stdin.send("n\n");
      }, 500);
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

    match(consoleLog.getCall(3).args[0], /Aborting\./i);
  });

  test("Shell throws without chain", async function () {
    const [account] = getAccounts();
    const privateKey = account.privateKey.slice(2);
    const consoleError = spy(logger, "error");
    await yargs(["shell", "--privateKey", privateKey]).command(mod).parse();

    const value = consoleError.getCall(0).args[0];
    equal(value, "missing required flag (`-c` or `--chain`)");
  });

  test("Shell throws with invalid chain", async function () {
    const [account] = getAccounts();
    const privateKey = account.privateKey.slice(2);
    const consoleError = spy(logger, "error");
    await yargs(["shell", "--privateKey", privateKey, "--chain", "foozbazz"])
      .command(mod)
      .parse();

    const value = consoleError.getCall(0).args[0];
    equal(value, "unsupported chain (see `chains` command for details)");
  });

  test("Custom baseUrl is called", async function () {
    const stdin = mockStd.stdin();
    const fetchSpy = spy(global, "fetch");

    setTimeout(() => {
      stdin.send("select * from\n").send("healthbot_31337_1;\n").end();
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
      "--baseUrl",
      "https://localhost:8909",
    ])
      .command(mod)
      .parse();

    const value = fetchSpy.getCall(0).args[0] as string;
    match(value, /https:\/\/localhost:8909\//);
  });

  test(".exit exits the shell", async function () {
    const ogExit = process.exit;

    // @ts-ignore
    process.exit = function (code: any) {
      console.log("Skiped process.exit in exit test");
    };

    const stdin = mockStd.stdin();
    const exit = spy(process, "exit");

    setTimeout(() => {
      stdin.send(".exit\n").end();
    }, 1000);

    const [account] = getAccounts();
    const privateKey = account.privateKey.slice(2);
    await yargs([
      "shell",
      "--chain",
      "local-tableland",
      "--privateKey",
      privateKey,
    ])
      .command(mod)
      .parse();
    assert.called(exit);

    process.exit = ogExit;
  });

  test("Shell Works with multi-line", async function () {
    const consoleLog = spy(logger, "log");
    const stdin = mockStd.stdin();

    setTimeout(() => {
      stdin.send("select * from\n").send("healthbot_31337_1;\n").end();
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

    const value = consoleLog.getCall(3).args[0];
    equal(value, '[{"counter":1}]');
  });
});
