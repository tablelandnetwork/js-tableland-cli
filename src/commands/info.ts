import type yargs from "yargs";
import type { Arguments, CommandBuilder } from "yargs";
import { getChainInfo, Validator } from "@tableland/sdk";
import EnsResolver from "../lib/EnsResolver";
import { JsonRpcProvider } from "@ethersproject/providers";
import { GlobalOptions } from "../cli";

type LocalOptions = {
  name: string;
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

  const [tableId, chainId] = name.split("_").reverse();

  const chain = parseInt(chainId);
  const network = getChainInfo(chain);

  if (!network) {
    console.error("unsupported chain (see `chains` command for details)");
    return;
  }

  try {
    const validator = Validator.forChain(parseInt(chainId));
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
