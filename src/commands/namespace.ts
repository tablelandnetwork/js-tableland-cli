import { JsonRpcProvider } from "@ethersproject/providers";
import { ChainName } from "@tableland/sdk";
import init from "@tableland/sqlparser";
import type yargs from "yargs";
import type { Arguments, CommandBuilder } from "yargs";
import EnsResolver from "../lib/EnsResolver";
import { getWalletWithProvider } from "../utils";

export type Options = {
  // Local
  domain: string;
  mappings: string[];
  privateKey: string;
  providerUrl: string;
  chain: ChainName;
};

export const command = "namespace <domain> [mappings..]";
export const desc = "Get info about a given table by name";

export const builder: CommandBuilder<{}, Options> = (yargs) =>
  yargs.positional("domain", {
    type: "string",
    description: "The root domain of the namespace",
  }) as yargs.Argv<Options>;

export const handler = async (argv: Arguments<Options>): Promise<void> => {
  const { domain, mappings, privateKey, providerUrl, chain } = argv;
  await init();

  const records = mappings.map((entry) => {
    const [key, value] = entry.split("=");
    console.log(entry);
    const keyRegex = /^[a-zA-Z0-9_]*$/;
    const valueRegex = /^[a-zA-Z_][a-zA-Z0-9_]*_[0-9]+_[0-9]+$/;

    if (keyRegex.exec(key) === null) {
      throw new Error("Only letters or underscores in key name");
    }
    if (valueRegex.exec(value) === null) {
      throw new Error("Tablename should be a valid tableland table name");
    }
    return {
      key,
      value,
    };
  });

  console.log("Domain", domain);
  console.log("Records", records);

  const signer = getWalletWithProvider({
    privateKey,
    chain,
    providerUrl,
  });

  const provider = new JsonRpcProvider(argv.providerUrl);
  const ensResolver = new EnsResolver({
    signer,
    provider,
  });

  ensResolver.addTableRecords(domain, records);
};
