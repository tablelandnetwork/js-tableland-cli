import type yargs from "yargs";
import type { Arguments, CommandBuilder } from "yargs";
import { helpers } from "@tableland/sdk";
import { init } from "@tableland/sqlparser";
import { type GlobalOptions } from "../cli.js";
import { setupCommand } from "../lib/commandSetup.js";
import { jsonFileAliases, logger } from "../utils.js";

export interface Options extends GlobalOptions {
  name: string;
}

export const command = "info <name>";
export const desc = "Get info about a given table by name";

export const builder: CommandBuilder<Record<string, unknown>, Options> = (
  yargs
) =>
  yargs.positional("name", {
    type: "string",
    description: "The target table name",
  }) as yargs.Argv<Options>;

export const handler = async (argv: Arguments<Options>): Promise<void> => {
  await init();
  try {
    const { name, aliases, enableEnsExperiment, ensProviderUrl } = argv;

    let chainId, tableId;
    // Check if the passed `name` is valid, otherwise, if it's a table alias,
    // making sure standard table names take precedence
    try {
      ({ chainId, tableId } = await globalThis.sqlparser.validateTableName(
        name
      ));
    } catch (err: any) {
      if (aliases) {
        try {
          const nameMap = await jsonFileAliases(aliases).read();
          const nameFromAlias = nameMap[name];
          ({ chainId, tableId } = await globalThis.sqlparser.validateTableName(
            nameFromAlias
          ));
        } catch (err: any) {
          // Throw only if ENS isn't enabled, which is checked next
          if (!(enableEnsExperiment && ensProviderUrl)) {
            logger.error("invalid table alias, table name not found");
            return;
          }
        }
      }
      // We'll throw later if `chainId` or `tableId` are undefined
    }
    // If ENS is enabled, perform a last attempt on validation
    if (enableEnsExperiment && ensProviderUrl) {
      const { ens } = await setupCommand({
        ...argv,
      });
      try {
        const nameFromEns = await ens?.resolveTable(name);
        if (nameFromEns)
          ({ chainId, tableId } = await globalThis.sqlparser.validateTableName(
            nameFromEns
          ));
      } catch (err: any) {
        logger.error("invalid ENS namespace, table record not found");
        return;
      }
    }

    // The "standard" table name was passed and is invalid if these are undefined
    if (tableId === undefined || chainId === undefined) {
      logger.error(
        "invalid table name (name format is `{prefix}_{chainId}_{tableId}`)"
      );
      return;
    }

    // Note: should `setupCommand` be used again, or instantiate a validator directly?
    const { validator } = await setupCommand({
      ...argv,
      chain: helpers.getChainInfo(chainId).chainName,
    });

    const res = await validator.getTableById({
      tableId: tableId.toString(),
      chainId,
    });
    logger.log(JSON.stringify(res));
    /* c8 ignore next 7 */
  } catch (err: any) {
    logger.error(
      typeof err?.cause?.message === "string"
        ? err?.cause?.message
        : err.message
    );
  }
};
