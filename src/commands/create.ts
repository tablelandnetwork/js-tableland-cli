import type { Arguments, CommandBuilder } from "yargs";
import { Wallet, providers, getDefaultProvider } from "ethers";
import { connect, ConnectionOptions, SUPPORTED_NETWORKS } from "@tableland/sdk";
import yargs from "yargs";

type Options = {
  // Local
  schema: string;
  prefix: string | undefined;

  // Global
  privateKey: string;
  host: string;
  network: string;
  alchemy: string | undefined;
  infura: string | undefined;
  etherscan: string | undefined;
  token: string;
};

const supportedNetworks: Record<string, string> = SUPPORTED_NETWORKS.reduce(
  (map, { key, name }) => ({
    ...map,
    [key]: name,
  }),
  {}
);

export const command = "create <schema> [prefix]";
export const desc = "Create a new table";

export const builder: CommandBuilder<Options, Options> = (yargs) =>
  yargs
    .positional("schema", {
      type: "string",
      description: "SQL table schema",
    })
    .option("prefix", {
      type: "string",
      description: "Table name prefix",
    }) as yargs.Argv<Options>;

export const handler = async (argv: Arguments<Options>): Promise<void> => {
  const {
    privateKey,
    host,
    token,
    schema,
    prefix,
    alchemy,
    infura,
    etherscan,
    network,
  } = argv;

  const options: ConnectionOptions = {};
  if (!privateKey) {
    throw new Error("private key string required for create statements");
  }

  const wallet = new Wallet(privateKey);
  let provider: providers.BaseProvider | undefined;
  if (infura) {
    provider = new providers.InfuraProvider(supportedNetworks[network], infura);
  } else if (etherscan) {
    provider = new providers.EtherscanProvider(
      supportedNetworks[network],
      etherscan
    );
  } else if (alchemy) {
    provider = new providers.AlchemyProvider(
      supportedNetworks[network],
      alchemy
    );
  } else {
    // This will be significantly rate limited, but we only need to run it once
    provider = getDefaultProvider(supportedNetworks[network]);
  }

  if (!provider) {
    throw new Error("Unable to create ETH API provider");
  }
  options.signer = wallet.connect(provider);
  if (token) {
    options.token = { token };
  }
  if (host) {
    options.host = host;
  }
  const tbl = await connect(options);
  const res = await tbl.create(schema, prefix);
  const out = JSON.stringify(
    { ...res, tableId: (res.tableId ?? "").toString() },
    null,
    2
  );
  console.log(out);
  process.exit(0);
};
