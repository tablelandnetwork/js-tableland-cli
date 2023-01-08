import { getAccounts } from "@tableland/local";
import { describe, test, afterEach, before } from "mocha";
import { spy, restore, assert } from "sinon";
import yargs from "yargs/yargs";
import { Database } from "@tableland/sdk";
import { getWalletWithProvider, wait } from "../src/utils.js";
import * as mod from "../src/commands/receipt.js";

describe("commands/receipt", function () {
  this.timeout("30s");

  before(async function () {
    await wait(10000);
  });

  afterEach(function () {
    restore();
  });


  test("Receipt throws without chain", async function () {
    const [account] = getAccounts();
    const privateKey = account.privateKey.slice(2);
    const consoleError = spy(console, "error");
    await yargs(["receipt", "--privateKey", privateKey, "ignored"])
      .command(mod)
      .parse();
    assert.calledWith(
      consoleError,
      'Cannot read properties of undefined (reading \'baseUrl\')'
    );
  });

  test("throws with invalid tx hash", async function () {
    const [account] = getAccounts();
    const privateKey = account.privateKey.slice(2);
    const consoleError = spy(console, "error");
    await yargs([
      "receipt",
      "--privateKey",
      privateKey,
      "--chain",
      "local-tableland",
      "ignored",
    ])
      .command(mod)
      .parse();
    assert.calledWith(
      consoleError,
      "Unexpected end of JSON input"
    );
  });

  test("Receipt passes with local-tableland", async function () {
    const [account] = getAccounts();
    const privateKey = account.privateKey.slice(2);
    const consoleLog = spy(console, "log");

    const signer = getWalletWithProvider({
      privateKey,
      chain: "local-tableland",
      providerUrl: undefined,
    });


    const db = new Database({signer})
      .prepare("update healthbot_31337_1 set counter=1;")
      .bind()
      .all();

    
    db.then(async () => {
      await yargs([
        "receipt",
        "--privateKey",
        privateKey,
        "--chain",
        "local-tableland",
        // @ts-ignore
        db.transactionHash,
      ])
        .command(mod)
        .parse();
      // TODO: Ideally, we check the response here, but the hashes aren't deterministic
      assert.calledOnce(consoleLog);
    });


  });
});
