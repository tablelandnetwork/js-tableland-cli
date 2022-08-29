import type yargs from "yargs";
import type { Arguments, CommandBuilder } from "yargs";
import fetch from "node-fetch";
import { ChainName } from "@tableland/sdk";
import getChains from "../chains";

type Options = {
  // Local
  name: string;

  chain: ChainName;
};

export const command = "schema <name>";
export const desc = "Get info about a given table schema";

export const builder: CommandBuilder = (yargs) =>
  yargs.positional("name", {
    type: "string",
    description: "The target table name",
  }) as yargs.Argv<Options>;

export const handler = async (argv: Arguments<Options>): Promise<void> => {
  const { name, chain } = argv;

  // This isn't strictly required, because this REST API is chain agnostic.
  // But this is how we determine which host string to use.
  const network = getChains()[chain];
  if (!network) {
    console.error("unsupported chain (see `chains` command for details)\n");
    process.exit(1);
  }

  const parts = name.split("_");
  if (parts.length < 3) {
    console.error(
      "invalid table name (name format is `{prefix}_{chainId}_{tableId}`)\n"
    );
    process.exit(1);
  }

  // This check isn't strictly required, because this REST API is chain agnostic.
  const chainId = parts.pop();
  if (chainId !== (network.chainId as number).toString()) {
    console.error(
      "table `chainId` does not match selected chain (see `chains` command for details)\n"
    );
    process.exit(1);
  }

  try {
    const res = await fetch(`${network.host}/schema/${name}`);
    const out = JSON.stringify(await res.json(), null, 2);
    console.log(out);
    process.exit(0);
  } catch (err: any) {
    console.error(err.message);
    process.exit(1);
  }
};
