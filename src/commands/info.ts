import type yargs from "yargs";
import type { Arguments, CommandBuilder } from "yargs";
import { GlobalOptions } from "../cli.js";
import { setupCommand } from "../lib/commandSetup.js";

type LocalOptions = {
  name: string;
  baseUrl: string | undefined;
};

type Options = GlobalOptions & LocalOptions;

export const command = "info <name>";
export const desc = "Get info about a given table by name";

export const builder: CommandBuilder<{}, Options> = (yargs) =>
  yargs.positional("name", {
    type: "string",
    description: "The target table name",
  }) as yargs.Argv<Options>;

export const handler = async (argv: Arguments<Options>): Promise<void> => {
  const { ens, validator } = await setupCommand(argv, { readOnly: true });

  let { name } = argv;
  const [tableId, chainId] = name.split("_").reverse();

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

  try {
    const res = await validator.getTableById({
      tableId,
      chainId: parseInt(chainId),
    });
    console.log(res);
    /* c8 ignore next 3 */
  } catch (err: any) {
    console.error(err?.cause?.message || err.message);
  }
};
