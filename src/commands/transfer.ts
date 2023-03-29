import type yargs from "yargs";
import type { Arguments, CommandBuilder } from "yargs";
import { GlobalOptions } from "../cli.js";
import { setupCommand } from "../lib/commandSetup.js";

export interface Options extends GlobalOptions {
  name: string;
  receiver: string;
}

export const command = "transfer <name> <receiver>";
export const desc = "Transfer a table to another address";

export const builder: CommandBuilder<{}, Options> = (yargs) =>
  yargs
    .positional("name", {
      type: "string",
      description: "The target table name",
    })
    .positional("receiver", {
      type: "string",
      description: "The address to transfer the table to",
    }) as yargs.Argv<Options>;

export const handler = async (argv: Arguments<Options>): Promise<void> => {
  try {
    const { name, receiver } = argv;
    const parts = name.split("_").reverse();
    const chainId = parts[1];

    if (parts.length < 3 && !argv.enableEnsExperiment) {
      console.error(
        "invalid table name (name format is `{prefix}_{chainId}_{tableId}`)"
      );
      return;
    }

    const { registry } = await setupCommand({
      ...argv,
      chain: parseInt(chainId) as any,
    });

    const res = await registry.safeTransferFrom({
      tableName: name,
      to: receiver,
    });
    console.log(JSON.stringify(res));
    /* c8 ignore next 3 */
  } catch (err: any) {
    console.error(err.message);
  }
};