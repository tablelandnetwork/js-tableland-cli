import type yargs from "yargs";
import type { Arguments, CommandBuilder } from "yargs";
import { getChainInfo, Validator } from "@tableland/sdk";

export type Options = {
  // Local
  name: string;
};

export const command = "schema <name>";
export const desc = "Get info about a given table schema";

export const builder: CommandBuilder<{}, Options> = (yargs) =>
  yargs.positional("name", {
    type: "string",
    description: "The target table name",
  }) as yargs.Argv<Options>;

export const handler = async (argv: Arguments<Options>): Promise<void> => {
  const { name } = argv;

  const parts = name.split("_");
  if (parts.length < 3) {
    console.error(
      "invalid table name (name format is `{prefix}_{chainId}_{tableId}`)"
    );
    return;
  }

  parts.pop()!;
  const chain = parseInt(parts.pop()!);
  const network = getChainInfo(chain);

  if (!network) {
    console.error("unsupported chain (see `chains` command for details)");
    return;
  }

  try {
    const [tableId, chainId] = name.split("_").reverse();
    const validator = Validator.forChain(parseInt(chainId));
    const res = await validator.getTableById({
      tableId,
      chainId: parseInt(chainId),
    });
    console.log(res.schema);
    /* c8 ignore next 3 */
  } catch (err: any) {
    console.error(err.message);
  }
};
