import type { Arguments, CommandBuilder } from "yargs";
import { Wallet, providers } from "ethers";
import { connect, ConnectionOptions, resultsToObjects } from "@tableland/sdk";
import yargs from "yargs";

type Options = {
  // Local
  hash: string;

  // Global
  privateKey: string;
  host: string;
};

export const command = "receipt <hash>";
export const desc =
  "Get the receipt of a chain transaction to know if it was executed, and the execution details";

export const builder: CommandBuilder<Options, Options> = (yargs) =>
  yargs.positional("hash", {
    type: "string",
    description: "Transaction hash",
  }) as yargs.Argv<Options>;

export const handler = async (argv: Arguments<Options>): Promise<void> => {
  const { hash, host, privateKey } = argv;
  const options: ConnectionOptions = {};
  if (privateKey) {
    // FIXME: This is a hack due to js-tableland's restrictive use of provider
    // See: https://github.com/tablelandnetwork/js-tableland/issues/22
    options.signer = new Wallet(privateKey, {
      getNetwork: async () => {
        return {
          name: "goerli",
          chainId: 5,
        };
      },
      _isProvider: true,
    } as providers.Provider);
  }
  if (host) {
    options.host = host;
  }
  const tbl = await connect(options);
  const res = await tbl.receipt(hash);
  const out = JSON.stringify(res, null, 2);
  console.log(out);
  process.exit(0);
};
