import type yargs from "yargs";
import type { Arguments, CommandBuilder } from "yargs";
import { Wallet } from "ethers";
import fetch from "node-fetch";
import { ChainName } from "@tableland/sdk";
import getChains from "../chains";

type Options = {
  // Local
  address: string;

  // Global
  privateKey: string;
  chain: ChainName;
};

export const command = "list [address]";
export const desc = "List tables by address";

export const builder: CommandBuilder<Options, Options> = (yargs) => {
  return yargs.positional("address", {
    type: "string",
    description: "The target address",
  }) as yargs.Argv<Options>;
};

export const handler = async (argv: Arguments<Options>): Promise<void> => {
  const { privateKey, chain } = argv;
  let { address } = argv;

  if (!address) {
    if (privateKey) {
      address = new Wallet(privateKey).address;
    } else {
      console.error("must supply `--privateKey` or `address` positional\n");
      process.exit(1);
    }
  }
  const network = getChains()[chain];
  if (!network) {
    console.error("unsupported chain (see `chains` command for details)\n");
    process.exit(1);
  }

  const res = await fetch(
    `${network.host}/chain/${network.chainId}/tables/controller/${address}`
  );
  const out = JSON.stringify(await res.json(), null, 2);
  console.log(out);
  process.exit(0);
};
