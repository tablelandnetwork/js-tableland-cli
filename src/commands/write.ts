import type { Arguments, CommandBuilder } from "yargs";
import { Wallet, providers } from "ethers";
import { connect, ConnectionOptions } from "@tableland/sdk";
import yargs from "yargs";

type Options = {
  // Local
  statement: string;

  // Global
  privateKey: string;
  host: string;
  token: string;
};

export const command = "write <statement>";
export const desc = "Run a mutating SQL statement against a remote table";

export const builder: CommandBuilder<Options, Options> = (yargs) =>
  yargs.positional("statement", {
    type: "string",
    description: "SQL write statement",
  }) as yargs.Argv<Options>;

export const handler = async (argv: Arguments<Options>): Promise<void> => {
  const { privateKey, host, token, statement } = argv;
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
  if (token) {
    options.token = { token };
  }
  if (host) {
    options.host = host;
  }
  const tbl = await connect(options);
  const res = await tbl.write(statement);
  const out = JSON.stringify(res, null, 2);
  process.stdout.write(`${out}\n`);
  process.exit(0);
};
