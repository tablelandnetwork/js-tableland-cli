import { JsonRpcProvider } from "@ethersproject/providers";
import { ChainName } from "@tableland/sdk";
import init from "@tableland/sqlparser";
import type yargs from "yargs";
import type { Arguments, CommandBuilder } from "yargs";
import EnsResolver from "../lib/EnsResolver.js";
import { getWalletWithProvider } from "../utils.js";

export type Options = {
  // Local
  domain: string;
  mappings: string[];
  privateKey: string;
  providerUrl: string;
  chain: ChainName;
  get: boolean;
  set: boolean;
  enableNamespaceExperiment: boolean;
};

export const command = "namespace <domain> [mappings..]";
export const desc = "Get info about a given table by name";

export const builder: CommandBuilder<{}, Options> = (yargs) =>
  yargs
    .positional("domain", {
      type: "string",
      description: "The root domain of the namespace",
    })
    .option("set", {
      type: "boolean",
      description: "Set text records for a namespace",
    })
    .option("get", {
      type: "boolean",
      description: "Pass in a record to find it's table name",
    })
    .usage(``) as yargs.Argv<Options>;

export const handler = async (argv: Arguments<Options>): Promise<void> => {
  const {
    domain,
    mappings,
    privateKey,
    providerUrl,
    chain,
    get,
    set,
    enableEnsExperiment,
  } = argv;
  if (!enableEnsExperiment) {
    console.error(
      'Namespace is an experimental command. You must add the "enableEnsExperiment" flag to use it.'
    );
  }
  await init();

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

  if (get) {
    console.log(await ensResolver.resolveTable(domain));
  }

  if (set) {
    if (!(await ensResolver.isOwner(domain))) {
      throw new Error("You don't own that ENS domain");
    }
    const records = mappings.map((entry: any) => {
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

    if (await ensResolver.addTableRecords(domain, records)) {
      console.log("Successfully added table mapppings to ens");
      mappings.forEach((mapping) => {
        console.log(mapping);
      });
    }
  }
};
