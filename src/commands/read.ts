import type { Arguments, CommandBuilder } from "yargs";
import { Wallet, providers } from "ethers";
import { connect, ConnectionOptions, resultsToObjects } from "@tableland/sdk";
import yargs from "yargs";

type Options = {
  // Local
  query: string;
  format: "raw" | "table" | "objects";

  // Global
  token: string;
  privateKey: string;
  host: string;
};

export const command = "read <query>";
export const desc = "Run a read-only query against a remote table";

export const builder: CommandBuilder<Options, Options> = (yargs) =>
  yargs
    .positional("query", {
      type: "string",
      description: "SQL query statement",
    })
    .option("format", {
      type: "string",
      description: "Output format. One of 'raw', 'tabular', or 'objects'.",
      default: "raw",
    }) as yargs.Argv<Options>;

export const handler = async (argv: Arguments<Options>): Promise<void> => {
  const { privateKey, host, token, query, format } = argv;
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
  const res = await tbl.read(query);
  const formatted = format === "raw" ? res : resultsToObjects(res);

  if (format.startsWith("tab")) {
    console.table(formatted);
  } else {
    const out = JSON.stringify(formatted, null, 2);
    console.log(out);
  }
  process.exit(0);
};
