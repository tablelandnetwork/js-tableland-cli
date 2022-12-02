import type { Arguments, CommandBuilder } from "yargs";
import cliSelect from 'cli-select';
import {
  connect,
  resultsToObjects,
  ConnectOptions,
  ChainName,
} from "@tableland/sdk";
import chalk from 'chalk';
import yargs from "yargs";
import { promises } from "fs";
import { createInterface } from "readline";
import { getChains } from "../utils.js";



export type Options = {
  // Local
  statement?: string;
  format: "pretty" | "table" | "objects";
  file?: string;

  // Global
  chain: ChainName;
};

export const command = "shell [statement]";
export const desc = "Run a read-only query against a remote table";
export const aliases = ["r", "query", "q"];

async function confirmQuery() {
  const selected = await cliSelect({
    values: {major: "Confirm write queries", minor: "Fire away, what's a few eth anyway?"},
    valueRenderer: (value, selected) => {
      if (selected) {
        return chalk.underline(value);
      }
      return value;
    }
  });
  console.log(chalk.bgBlue(selected.value));
  return selected.id;
}

async function shellYeah(argv:any) {
  let { statement } = argv;
  const { format, chain, file } = argv;
  const options: ConnectOptions = {
    chain,
  };

  try {
    if (file != null) {
      statement = await promises.readFile(file, { encoding: "utf-8" });
    } else if (statement == null) {

      statement = "";
      const rl = createInterface({ input: process.stdin });

      const it = rl[Symbol.asyncIterator]();
      
      for await (const enter of it) {       
        
        const state = enter;
        // @ts-ignore
        statement += '\r\n';
        statement += state;
        if(state.trim().endsWith(";")) {
          rl.close();
          break;          
        } 
      }

      switch(true) {
        case statement.trim().endsWith(".help"): 
          console.log("Uh, I didn't think I'd get this far");
          break;
        case statement.trim().endsWith(";"): 
          // Parse query for read, write, or create;
          // If write or create, confrm with cliSelect
          // If read, return response in Tabular form
          break;
        
        
      }

    }
    if (!statement) {
      console.error(
        chalk.cyanBright("missing input value (`statement`, `file`, or piped input from stdin required)")
      );
      return;
    }
    const res = await connect(options).read(statement);
    // Defaults to "table" output format
    // After we upgrade the SDK to version 4.x, we can drop some of this formatting code
    const formatted = format === "table" ? res : resultsToObjects(res);

    if (format === "pretty") {
      console.table(formatted);
    } else {
      const out = JSON.stringify(formatted, null, 2);
      console.log(out);
    }
    /* c8 ignore next 3 */
  } catch (err: any) {
    console.error(err.message);
  }

  shellYeah(argv);
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
      default: "table",
    })
    .option("file", {
      type: "string",
      alias: "f",
      description: "Get statement from input file",
    }) as yargs.Argv<Options>;

export const handler = async (argv: Arguments<Options>): Promise<void> => {
  const { chain } = argv;

  const network = getChains()[chain];
  if (!network) {
    console.error("unsupported chain (see `chains` command for details)");
  }

  console.log("Welcome to Tableland");
  console.log("Tableland CLI version 0.2.1");
  console.log(`Enter ".help" for usage hints`);
  console.log("Connect to Polygon Mumbai using 0x0000");

  await shellYeah(argv);
};
