import { Wallet, providers, getDefaultProvider } from "ethers";
import { ChainName } from "@tableland/sdk";
import getChains from "./chains.js";

export interface Options {
  privateKey: string;
  chain: ChainName;
  providerUrl: string | undefined;
}

export function getLink(chain: ChainName, hash: string): string {
  if (!hash) {
    return "";
  }
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
    if (chain.includes("kovan")) {
      return `https://kovan-optimistic.etherscan.io/tx/${hash}`;
    } else if (chain.includes("goerli")) {
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
}

export function getSignerOnly({
  privateKey,
  chain,
}: {
  privateKey: string;
  chain: ChainName;
}): Wallet {
  if (!privateKey) {
    throw new Error("missing required flag (`-k` or `--privateKey`)");
  }
  const network = getChains()[chain];
  if (!network) {
    throw new Error("unsupported chain (see `chains` command for details)");
  }

  // FIXME: This is a hack due to a regression in js-tableland
  // See: https://github.com/tablelandnetwork/js-tableland/issues/22
  const signer = new Wallet(privateKey, {
    getNetwork: async () => {
      return network;
    },
    _isProvider: true,
  } as providers.Provider);
  return signer;
}

export function getWalletWithProvider({
  privateKey,
  chain,
  providerUrl,
}: Options): Wallet {
  if (!privateKey) {
    throw new Error("missing required flag (`-k` or `--privateKey`)");
  }
  const network = getChains()[chain];
  if (!network) {
    throw new Error("unsupported chain (see `chains` command for details)");
  }

  const wallet = new Wallet(privateKey);
  let provider: providers.BaseProvider = new providers.JsonRpcProvider(
    chain === "local-tableland" ? undefined : providerUrl, // Defaults to localhost
    network.name
  );
  if (!provider) {
    // This will be significantly rate limited, but we only need to run it once
    provider = getDefaultProvider(network);
  }
  if (!provider) {
    throw new Error("unable to create ETH API provider");
  }
  return wallet.connect(provider);
}
