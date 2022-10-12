import { describe, test, afterEach, before } from "mocha";
import { spy, restore, assert, match } from "sinon";
import yargs from "yargs/yargs";
import fetch, { Headers, Request, Response } from "node-fetch";
import { temporaryWrite } from "tempy";
import mockStd from "mock-stdin";
import { getAccounts } from "@tableland/local";
import * as mod from "../src/commands/create.js";

describe("commands/create", function () {
  this.timeout("30s");

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
    await yargs(["create", "blah"]).command(mod).parse();
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
      "create",
      "(id int primary key, desc text)",
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
      "create",
      "invalid",
      "--chain",
      "local-tableland",
      "--privateKey",
      privateKey,
    ])
      .command(mod)
      .parse();
    assert.calledWith(
      consoleError,
      "calling ValidateCreateTable parsing create table statement: unable to parse the query: syntax error at position 29 near ')'"
    );
  });

  test("throws with missing file", async function () {
    const [account] = getAccounts();
    const privateKey = account.privateKey.slice(2);
    const consoleError = spy(console, "error");
    await yargs([
      "create",
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
      "create",
      "--chain",
      "local-tableland",
      "--privateKey",
      privateKey,
    ])
      .command(mod)
      .parse();
    assert.calledWith(
      consoleError,
      "missing input value (`schema`, `file`, or piped input from stdin required)"
    );
  });

  test("passes with local-tableland", async function () {
    const [account] = getAccounts();
    const privateKey = account.privateKey.slice(2);
    const consoleLog = spy(console, "log");
    await yargs([
      "create",
      "id int primary key, name text",
      "--chain",
      "local-tableland",
      "--privateKey",
      privateKey,
      "--prefix",
      "first_table",
    ])
      .command(mod)
      .parse();
    assert.calledWith(
      consoleLog,
      match(function (value: string) {
        const { prefix, name, chainId, tableId, txnHash } = JSON.parse(value);
        return (
          prefix === "first_table" &&
          chainId === 31337 &&
          name.startsWith(prefix) &&
          name.endsWith(tableId) &&
          typeof txnHash === "string" &&
          txnHash.startsWith("0x")
        );
      }, "does not match")
    );
  });

  test("passes with full create statement (override prefix)", async function () {
    const [account] = getAccounts();
    const privateKey = account.privateKey.slice(2);
    const consoleLog = spy(console, "log");
    await yargs([
      "create",
      "create table second_table (id int primary key, name text);",
      "--chain",
      "local-tableland",
      "--privateKey",
      privateKey,
      "--prefix",
      "ignore_me",
    ])
      .command(mod)
      .parse();
    assert.calledWith(
      consoleLog,
      match(function (value: string) {
        const { prefix, name, chainId, tableId, txnHash } = JSON.parse(value);
        return (
          prefix === "second_table" &&
          chainId === 31337 &&
          name.startsWith(prefix) &&
          name.endsWith(tableId) &&
          typeof txnHash === "string" &&
          txnHash.startsWith("0x")
        );
      }, "does not match")
    );
  });

  test("passes when provided input from file", async function () {
    const [account] = getAccounts();
    const privateKey = account.privateKey.slice(2);
    const consoleLog = spy(console, "log");
    const path = await temporaryWrite(`\nid int primary key,\nname text\n`);
    await yargs([
      "create",
      "--chain",
      "local-tableland",
      "--file",
      path,
      "--privateKey",
      privateKey,
      "--prefix",
      "file_test",
    ])
      .command(mod)
      .parse();
    assert.calledWith(
      consoleLog,
      match(function (value: string) {
        const { prefix, name, chainId, tableId, txnHash } = JSON.parse(value);
        return (
          prefix === "file_test" &&
          chainId === 31337 &&
          name.startsWith(prefix) &&
          name.endsWith(tableId) &&
          typeof txnHash === "string" &&
          txnHash.startsWith("0x")
        );
      }, "does not match")
    );
  });

  test("passes when provided input from stdin", async function () {
    const [account] = getAccounts();
    const privateKey = account.privateKey.slice(2);
    const consoleLog = spy(console, "log");
    const stdin = mockStd.stdin();
    process.nextTick(() => {
      stdin
        .send("create table stdin_test (id int primary key, name text);\n")
        .end();
    });
    await yargs([
      "create",
      "--chain",
      "local-tableland",
      "--privateKey",
      privateKey,
    ])
      .command(mod)
      .parse();
    assert.calledWith(
      consoleLog,
      match(function (value: string) {
        const { prefix, name, chainId, tableId, txnHash } = JSON.parse(value);
        return (
          prefix === "stdin_test" &&
          chainId === 31337 &&
          name.startsWith(prefix) &&
          name.endsWith(tableId) &&
          typeof txnHash === "string" &&
          txnHash.startsWith("0x")
        );
      }, "does not match")
    );
  });
});