import type yargs from "yargs";
import type { Arguments, CommandBuilder } from "yargs";
import { Database, ChainName } from "@tableland/sdk";
import { getWalletWithProvider, getLink } from "../utils.js";
import { createInterface } from "readline";
import { promises } from "fs";

export type Options = {
  // Local
  schema?: string;
  prefix?: string;
  file?: string;

  // Global
  privateKey: string;
  chain: ChainName;
  providerUrl: string | undefined;
};

export const command = "create [schema]";
export const desc = "Create a new table";

// const regex = /^\s*CREATE\s+TABLE\s+([\w\d]+)\s*\((.*)\)\s*;?\s*/gim;

export const builder: CommandBuilder<{}, Options> = (yargs) =>
  yargs
    .positional("schema", {
      type: "string",
      description:
        "SQL table schema, or full create statement (skip to read from stdin)",
    })
    .option("prefix", {
      type: "string",
      description:
        "Table name prefix (ignored if full create statement is provided)",
    })
    .option("file", {
      alias: "f",
      description: "Get statement from input file",
    }) as yargs.Argv<Options>;

export const handler = async (argv: Arguments<Options>): Promise<void> => {
  let { schema } = argv;
  const { privateKey, chain, providerUrl, file } = argv;

  try {
    const signer = getWalletWithProvider({
      privateKey,
      chain,
      providerUrl,
    });

    if (file != null) {
      schema = await promises.readFile(file, { encoding: "utf-8" });
    } else if (schema == null) {
      const rl = createInterface({ input: process.stdin });
      const it = rl[Symbol.asyncIterator]();
      const { value } = await it.next();
      schema = value;
    }
    if (!schema) {
      console.error(
        "missing input value (`schema`, `file`, or piped input from stdin required)"
      );
      return;
    }


    const db = new Database({signer});
    const res = await db.prepare(schema).bind().all();
    const link = getLink(chain, res.meta.txn?.transactionHash || "");
    const out = JSON.stringify(
      { ...res, link },
      null,
      2
    );
    console.log(out);
    /* c8 ignore next 3 */
  } catch (err: any) {
    console.error(err.message);
  }
};
