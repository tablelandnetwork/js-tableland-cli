import { getAccounts } from "@tableland/local";
import { describe, test, afterEach, before } from "mocha";
import { spy, restore, assert } from "sinon";
import yargs from "yargs/yargs";
import fetch, { Headers, Request, Response } from "node-fetch";
import * as mod from "../src/commands/hash.js";

describe("commands/hash", function () {
  before(async function () {
    if (!globalThis.fetch) {
      (globalThis as any).fetch = fetch;
      (globalThis as any).Headers = Headers;
      (globalThis as any).Request = Request;
      (globalThis as any).Response = Response;
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  });
  afterEach(function () {
    restore();
  });

  test("throws without privateKey", async function () {
    const consoleError = spy(console, "error");
    await yargs(["hash", "blah"]).command(mod).parse();
    assert.calledWith(
      consoleError,
      "missing required flag (`-k` or `--privateKey`)"
    );
  });

  test("throws without chain", async function () {
    const [account] = getAccounts();
    const privateKey = account.privateKey.slice(2);
    const consoleError = spy(console, "error");
    await yargs(["hash", "--privateKey", privateKey, "ignored"])
      .command(mod)
      .parse();
    assert.calledWith(
      consoleError,
      "unsupported chain (see `chains` command for details)"
    );
  });

  test("throws with invalid schema", async function () {
    const [account] = getAccounts();
    const privateKey = account.privateKey.slice(2);
    const consoleError = spy(console, "error");
    await yargs([
      "hash",
      "--privateKey",
      privateKey,
      "--chain",
      "local-tableland",
      "invalid",
    ])
      .command(mod)
      .parse();
    assert.calledWith(
      consoleError,
      "calling ValidateCreateTable parsing create table statement: unable to parse the query: syntax error at position 29 near ')'"
    );
  });

  test("passes with local-tableland (prefix ignored)", async function () {
    const [account] = getAccounts();
    const privateKey = account.privateKey.slice(2);
    const consoleLog = spy(console, "log");
    await yargs([
      "hash",
      "counter integer",
      "--privateKey",
      privateKey,
      "--prefix",
      "ignored",
      "--chain",
      "local-tableland",
    ])
      .command(mod)
      .parse();
    assert.calledWith(
      consoleLog,
      `{
  "structureHash": "2f852efa05457a128810b4897bd845840b6a3e687dca0850f8260b5b0e930055"
}`
    );
  });
});
