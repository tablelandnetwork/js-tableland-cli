import type yargs from "yargs";
import type { Arguments, CommandBuilder } from "yargs";
import { init } from "@tableland/sqlparser";
import { type GlobalOptions } from "../cli.js";
import { setupCommand } from "../lib/commandSetup.js";
import { logger, jsonFileAliases } from "../utils.js";

export interface Options extends GlobalOptions {
  name: string;
  receiver: string;
}

export const command = "transfer <name> <receiver>";
export const desc = "Transfer a table to another address";

export const builder: CommandBuilder<Record<string, unknown>, Options> = (
  yargs
) =>
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
    await init();
    const { receiver, chain, aliases } = argv;
    let { name } = argv;

    let chainId;
    // Check if the passed `name` is valid, otherwise, if it's a table alias,
    // making sure standard table names take precedence
    try {
      ({ chainId } = await globalThis.sqlparser.validateTableName(name));
    } catch (err: any) {
      if (aliases) {
        try {
          const nameMap = await jsonFileAliases(aliases).read();
          const nameFromAlias = nameMap[name];
          ({ chainId } = await globalThis.sqlparser.validateTableName(
            nameFromAlias
          ));
          name = nameFromAlias;
        } catch (err: any) {
          logger.error(
            "invalid table name (name format is `{prefix}_{chainId}_{tableId}`)"
          );
          return;
        }
      }
    }

    const { registry } = await setupCommand({
      ...argv,
      // @ts-ignore TODO: fix this
      chain: chain != null ? chain : chainId,
    });

    const res = await registry.safeTransferFrom({
      tableName: name,
      to: receiver,
    });
    logger.log(JSON.stringify(res));
    /* c8 ignore next 3 */
  } catch (err: any) {
    logger.error(err.message);
  }
};
