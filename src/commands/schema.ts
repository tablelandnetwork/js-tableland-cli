import type yargs from "yargs";
import type { Arguments, CommandBuilder } from "yargs";
import { getChainInfo } from "@tableland/sdk";
import { GlobalOptions } from "../cli.js";
import { setupCommand } from "../lib/commandSetup.js";

export type Options = GlobalOptions & {
  name: string;
  baseUrl: string | undefined;
};

export const command = "schema <name>";
export const desc = "Get info about a given table schema";

export const builder: CommandBuilder<{}, Options> = (yargs) =>
  yargs.positional("name", {
    type: "string",
    description: "The target table name",
  }) as yargs.Argv<Options>;

export const handler = async (argv: Arguments<Options>): Promise<void> => {
  const { validator, ens } = await setupCommand(argv);
  let { name } = argv;

  if (argv.enableEnsExperiment && ens) {
    name = await ens.resolveTable(name);
  }

  const parts = name.split("_");
  if (parts.length < 3) {
    console.error(
      "invalid table name (name format is `{prefix}_{chainId}_{tableId}`)"
    );
    return;
  }

  const tableId = parts.pop() as string;
  const chainId = parseInt(parts.pop()!);
  const network = getChainInfo(chainId);

  if (!network) {
    console.error("unsupported chain (see `chains` command for details)");
    return;
  }

  try {
    const res = await validator.getTableById({
      tableId,
      chainId,
    });
    console.dir(res.schema, { depth: null });
    /* c8 ignore next 3 */
  } catch (err: any) {
    console.error(err.message);
  }
};
