// TODO: this stuff was declared here but never being used, commenting out so lint can pass -JW
// import { Provider } from "@ethersproject/abstract-provider";
// import { ChainInfo, Database } from "@tableland/sdk";
// import { Signer, Wallet } from "ethers";
// import EnsResolver from "./EnsResolver.js";
import { GlobalOptions } from "../cli.js";

// interface CliConnectors {
//   signer?: Signer;
//   provider?: Provider;
//   wallet?: Wallet;
//   database: Database;
//   ens: EnsResolver;
//   chain: ChainInfo;
// }

export default async function initializeConnectors(
  argv: GlobalOptions
): Promise<any> {
  return {};
}
