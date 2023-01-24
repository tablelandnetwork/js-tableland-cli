import { Database, Registry, Validator } from "@tableland/sdk";
import init from "@tableland/sqlparser";
import { Signer } from "ethers";
import { GlobalOptions } from "../cli";
import { getChains, getWalletWithProvider } from "../utils";
import EnsResolver from "./EnsResolver";

export type ConnectionsOptions = { readOnly: boolean };

export class Connections {
  _database: Database | undefined;
  _validator: Validator;
  _signer: Signer | undefined;
  _registry: Registry | undefined;
  _ens: EnsResolver | undefined;

  get ens(): EnsResolver | undefined {
    return this._ens;
  }

  get validator(): Validator {
    return this._validator;
  }

  get signer(): Signer {
    if (!this._signer) {
      throw new Error(
        "To send transactions, you need to specify a privateKey, providerUrl, and chain"
      );
    }
    return this._signer;
  }

  get database(): Database {
    if (!this._database)
      throw new Error(
        "No database defined. You must specify a providerUrl or chain."
      );
    return this._database;
  }

  constructor(
    argv: GlobalOptions,
    options: { readOnly: boolean } = { readOnly: false }
  ) {
    const {
      privateKey,
      chain,
      providerUrl,
      baseUrl,
      enableEnsExperiment,
      ensProviderUrl,
    } = argv;
    const { readOnly } = options;
    let signer: Signer | undefined;

    if (!options.readOnly) {
      signer = getWalletWithProvider({
        privateKey,
        providerUrl,
        chain,
      });
      this._signer = signer;
    }

    if (enableEnsExperiment && ensProviderUrl) {
      this._ens = new EnsResolver({
        ensProviderUrl,
        signer,
      });
    }

    const network = getChains()[chain];
    if (!network) {
      console.error("unsupported chain (see `chains` command for details)");
    }

    this._database =
      readOnly && !baseUrl
        ? Database.readOnly(chain)
        : new Database({
            signer,
            baseUrl,
          });

    this._validator =
      baseUrl || !chain
        ? new Validator({ baseUrl })
        : Validator.forChain(chain);
  }
}

export async function setupCommand(
  argv: GlobalOptions,
  options?: ConnectionsOptions
) {
  await init();
  return new Connections(argv, options);
}
