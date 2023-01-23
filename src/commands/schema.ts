import type yargs from "yargs";
import type { Arguments, CommandBuilder } from "yargs";
import { getChainInfo, Validator } from "@tableland/sdk";
import EnsResolver from "../lib/EnsResolver.js";
import { JsonRpcProvider } from "@ethersproject/providers";
import { GlobalOptions } from "../cli.js";

type LocalOptions = {
  name: string;
};

export type Options = LocalOptions & GlobalOptions;

export const command = "schema <name>";
export const desc = "Get info about a given table schema";

export const builder: CommandBuilder<{}, Options> = (yargs) =>
  yargs.positional("name", {
    type: "string",
    description: "The target table name",
  }) as yargs.Argv<Options>;

export const handler = async (argv: Arguments<Options>): Promise<void> => {
  let { name, providerUrl } = argv;

  if (argv.enableEnsExperiment) {
    const ensRes = new EnsResolver({
      provider: new JsonRpcProvider(providerUrl),
    });
    name = await ensRes.resolveTable(name);
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
    const validator = Validator.forChain(chainId);
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
