import { describe, test, afterEach, before } from "mocha";
import { spy, restore, assert, match } from "sinon";
import yargs from "yargs/yargs";
import { getAccounts } from "@tableland/local";
import * as mod from "../src/commands/transfer.js";
import { wait } from "../src/utils.js";
import { helpers } from "@tableland/sdk";

describe("commands/transfer", function () {
  this.timeout("30s");

  before(async function () {
    await wait(10000);
  });

  afterEach(function () {
    restore();
  });

  test("throws without privateKey", async function () {
    const consoleError = spy(console, "error");
    await yargs(["transfer", "healthbot_31337_1", "0x0000000000000000000000"])
      .command(mod)
      .parse();
    assert.calledWith(
      consoleError,
      "No registry. This may be because you did not specify a private key with which to interact with the registry."
    );
  });

  test("throws with invalid chain", async function () {
    const [account] = getAccounts();
    const privateKey = account.privateKey.slice(2);
    const consoleError = spy(console, "error");
    await yargs([
      "transfer",
      "healthbot_31337_1",
      "0x0000000000000000000000000000000000000000",
      "--chain",
      "does-not-exist",
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

  test("throws with invalid table name", async function () {
    const [account] = getAccounts();
    const privateKey = account.privateKey.slice(2);
    const consoleError = spy(console, "error");
    await yargs(["transfer", "healthbot", "blah", "-k", privateKey])
      .command(mod)
      .parse();
    assert.calledWith(
      consoleError,
      "invalid table name (name format is `{prefix}_{chainId}_{tableId}`)"
    );
  });

  test("throws with invalid receiver address", async function () {
    const [account] = getAccounts();
    const privateKey = account.privateKey.slice(2);
    const consoleError = spy(console, "error");
    await yargs([
      "transfer",
      "healthbot_31337_1",
      "0x00",
      "--privateKey",
      privateKey,
      "--chain",
      "local-tableland",
    ])
      .command(mod)
      .parse();
    assert.calledWith(
      consoleError,
      'invalid address (argument="address", value="0x00", code=INVALID_ARGUMENT, version=address/5.7.0)'
    );
  });

  // Does transfering table have knock-on effects on other tables?
  test("Write passes with local-tableland", async function () {
    const [account1, account2] = getAccounts();
    const account2Address = account2.address;
    const consoleLog = spy(console, "log");
    const privateKey = account1.privateKey.slice(2);
    await yargs([
      "transfer",
      "healthbot_31337_1",
      account2Address,
      "--privateKey",
      privateKey,
      "--chain",
      "local-tableland",
    ])
      .command(mod)
      .parse();

    assert.calledWith(
      consoleLog,
      match(function (value: any) {
        value = JSON.parse(value);
        const { to, from } = value;
        return (
          from === account1.address &&
          to === helpers.getContractAddress("local-tableland")
        );
      }, "does not match")
    );
  });
});
