import type { Arguments, CommandBuilder } from "yargs";
import cliSelect from "cli-select";
import { ChainName, Database, Config } from "@tableland/sdk";
// @ts-ignore
import chalk from "chalk";
import yargs from "yargs";
import { createInterface } from "readline";
import { getChains, getWalletWithProvider } from "../utils.js";
// @ts-ignore
import init from "@tableland/sqlparser";

export type Options = {
  // Local
  statement?: string;
  format: "pretty" | "table" | "objects";

  // Global
  chain: ChainName;
  privateKey: string;
  providerUrl: string | undefined;
};

export const command = "shell";
export const desc = "Run consecutive queries against tableland";
export const aliases = ["r", "query", "q"];

process.on("SIGINT", function () {
  console.log("Caught interrupt signal");

  process.exit();
});

async function confirmQuery() {
  const selected = await cliSelect({
    values: {
      confirm: "Confirm: Send this transaction to the network",
      deny: "Oops. No, don't send that transaction.",
      // fireAndForget:
      //   "Fire and forget: Send, but don't want for confirmation. DO NOT RECOMMEND.",
    },
    valueRenderer: (value, selected) => {
      if (selected) {
        return chalk.underline(value);
      }
      return value;
    },
  });

  console.log(chalk.bgBlue(selected.id));
  if (selected.id === "confirm") {
    console.log(
      chalk.underline("Committing to network. This will take a few moments.")
    );
    return false;
  }

  return selected.id;
}

async function fireFullQuery(
  statement: string,
  argv: any,
  tablelandConnection: Database
) {
  switch (true) {
    case statement.trim().endsWith(".help"):
      console.log("Uh, I didn't think I'd get this far");
      break;
    case statement.trim().endsWith(";"):
      // Parse query for read, write, or create;
      // If write or create, confrm with cliSelect
      // If read, return response in Tabular form
      break;
  }

  try {
    // @ts-ignore
    const { type } = await globalThis.sqlparser.normalize(statement);

    let stmt;
    let confirm: any = true;

    if (type === "write") {
      confirm = (await confirmQuery()) === "confirm";
    }
    if (!confirm) return;
    try {
      stmt = tablelandConnection.prepare(statement).bind();
      const { results } = await stmt.all();
      console.log(results);
    } catch (e) {
      console.error(e);
    }
  } catch (e) {
    console.log(e);
  }
}

async function shellYeah(
  argv: any,
  tablelandConnection: Database,
  history: string[] = []
) {
  try {
    let statement = "";
    const rl = createInterface({
      history,
      input: process.stdin,
      output: process.stdout,
      prompt: "tableland>",
      terminal: true,
    });
    rl.prompt();
    rl.on("history", (newHistory) => {
      history = newHistory;
    });
    rl.on("SIGINT", () => {
      process.exit();
    });

    for await (const enter of rl) {
      const state = enter;
      // @ts-ignore
      statement += "\r\n";
      statement += state;
      rl.setPrompt("      ...>");

      if (state.trim().endsWith(";")) {
        break;
      }
      rl.prompt();
    }
    rl.close();
    await fireFullQuery(statement, argv, tablelandConnection);

    shellYeah(argv, tablelandConnection, history);
  } catch (err: any) {
    console.error(err.message);
  }
}

export const builder: CommandBuilder<{}, Options> = (yargs) =>
  yargs
    .positional("statement", {
      type: "string",
      description: "Input SQL statement (skip to read from stdin)",
    })
    .option("format", {
      type: "string",
      choices: ["pretty", "table", "objects"] as const,
      description: "Output format. One of 'pretty', 'table', or 'objects'.",
      default: "pretty",
    }) as yargs.Argv<Options>;

export const handler = async (argv: Arguments<Options>): Promise<void> => {
  await init();
  const { privateKey, chain, providerUrl } = argv;

  const signer = getWalletWithProvider({
    privateKey,
    chain,
    providerUrl,
  });
  const options: Config = {
    signer,
  };

  const tablelandConnection = new Database(options);

  const network: any = getChains()[chain];
  if (!network) {
    console.error("unsupported chain (see `chains` command for details)");
  }

  console.log("Welcome to Tableland");
  console.log(`Tableland CLI shell`);
  // console.log(`Enter ".help" for usage hints`);
  console.log(`Connected to ${network.chainName} using ${signer.address}`);

  await shellYeah(argv, tablelandConnection);
};
