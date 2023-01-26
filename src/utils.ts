import { Wallet, providers, getDefaultProvider } from "ethers";
import { helpers } from "@tableland/sdk";

export const getChains = () =>
  Object.fromEntries(
    Object.entries(helpers.supportedChains).filter(
      ([name]) => !name.includes("staging")
    )
  );

export interface Options {
  privateKey: string;
  chain: helpers.ChainName;
  providerUrl: string | undefined;
}

export const wait = (timeout: number) =>
  new Promise((resolve) => setTimeout(resolve, timeout));

export function getLink(chain: helpers.ChainName, hash: string): string {
  /* c8 ignore start */
  if (chain.includes("ethereum")) {
    if (chain.includes("goerli")) {
      return `https://goerli.etherscan.io/tx/${hash}`;
    }
    return `https://etherscan.io/tx/${hash}`;
  } else if (chain.includes("polygon")) {
    if (chain.includes("mumbai")) {
      return `https://mumbai.polygonscan.com/tx/${hash}`;
    }
    return `https://polygonscan.com/tx/${hash}`;
  } else if (chain.includes("optimism")) {
    if (chain.includes("goerli")) {
      return `https://blockscout.com/optimism/goerli/tx/${hash}`;
    }
    return `https://optimistic.etherscan.io/tx/${hash}`;
  } else if (chain.includes("arbitrum")) {
    if (chain.includes("goerli")) {
      return `https://goerli-rollup-explorer.arbitrum.io/tx/${hash}`;
    }
    return `https://arbiscan.io/tx/${hash}`;
  }
  return "";
  /* c8 ignore stop */
}

export function getWalletWithProvider({
  privateKey,
  chain,
  providerUrl,
}: Options): Wallet {
  if (privateKey == null) {
    throw new Error("missing required flag (`-k` or `--privateKey`)");
  }
  const network: any = helpers.getChainInfo(chain);
  if (network == null) {
    throw new Error(`cannot use unsupported chain: ${chain}`);
  }

  const wallet = new Wallet(privateKey);
  let provider: providers.BaseProvider = new providers.JsonRpcProvider(
    chain === "local-tableland" && !providerUrl
      ? "http://127.0.0.1:8545"
      : providerUrl,
    network.name === "localhost" ? undefined : network.name
  );
  /* c8 ignore start */
  if (!provider) {
    // This will be significantly rate limited, but we only need to run it once
    provider = getDefaultProvider(network);
  }
  if (!provider) {
    throw new Error("unable to create ETH API provider");
  }
  /* c8 ignore stop */
  return wallet.connect(provider);
}
