import type { Arguments, CommandBuilder } from "yargs";
import { Wallet } from "ethers";
import { userCreatesToken, SUPPORTED_NETWORKS } from "@tableland/sdk";

type Options = {
  // Global
  privateKey: string;
  network: string;
};

export const command = "token";
export const desc = "Create a SIWE token";

export const builder: CommandBuilder<Options, Options> = (yargs) => yargs;

export const handler = async (argv: Arguments<Options>): Promise<void> => {
  const { privateKey, network } = argv;

  if (!privateKey) {
    process.stderr.write("Missing required flag (`-k` or `--privateKey`)\n");
    process.exit(1);
  }
  const signer = new Wallet(privateKey);
  const chainId =
    SUPPORTED_NETWORKS.find((net) => net.key === network)?.chainId ?? 5;

  const { token } = await userCreatesToken(signer, chainId);
  const out = JSON.stringify(token, null, 2);
  console.log(out);
  process.exit(0);
};
