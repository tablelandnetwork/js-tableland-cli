import type { Arguments, CommandBuilder } from "yargs";
import { SUPPORTED_NETWORKS } from "@tableland/sdk";

type Options = {
  // Global
  host: string | undefined;
};

export const command = "networks";
export const desc = "List information about supported networks";

export const builder: CommandBuilder<Options, Options> = (yargs) => yargs;

export const handler = async (argv: Arguments<Options>): Promise<void> => {
  const { host } = argv;
  // Just filter out the others if host mentions staging
  const supportedNetworks = SUPPORTED_NETWORKS.filter(({ chainId }) =>
    host && host.includes("staging") ? chainId === 69 : true
  );
  const out = JSON.stringify(supportedNetworks, null, 2);
  console.log(out);
  process.exit(0);
};
