import { Provider } from "@ethersproject/abstract-provider";
import { ChainInfo, Database } from "@tableland/sdk";
import { Signer, Wallet } from "ethers";
import { GlobalOptions } from "../cli";
import EnsResolver from "./EnsResolver";

interface CliConnectors {
  signer?: Signer;
  provider?: Provider;
  wallet?: Wallet;
  database: Database;
  ens: EnsResolver;
  chain: ChainInfo;
}

export default async function initializeConnectors(
  argv: GlobalOptions
): Promise<any> {
  return {};
}
