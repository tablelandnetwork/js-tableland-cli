import type yargs from "yargs";
import type { Arguments, CommandBuilder } from "yargs";
import { connect, ConnectOptions, ChainName } from "@tableland/sdk";
import { getWallet } from "../utils";

type Options = {
  // Local
  name: string;
  controller: string;

  // Global
  privateKey: string;
  chain: ChainName;
  alchemy: string | undefined;
  infura: string | undefined;
  etherscan: string | undefined;
};

export const command = "controller <sub>";
export const desc =
  "Get, set, and lock the controller contract for a given table";

export const builder: CommandBuilder<Options, Options> = (yargs) =>
  yargs
    .command(
      "get <name>",
      "Get the current controller address for a table",
      (yargs) =>
        yargs.positional("name", {
          type: "string",
          description: "The target table name",
        }) as yargs.Argv<Options>,
      async (argv) => {
        const { name, chain, privateKey, etherscan, infura, alchemy } = argv;

        try {
          const signer = getWallet({
            privateKey,
            chain,
            infura,
            etherscan,
            alchemy,
          });
          const options: ConnectOptions = {
            chain,
            signer,
          };
          const res = await connect(options).getController(name);
          const out = JSON.stringify(res, null, 2);
          console.log(out);
          process.exit(0);
        } catch (err: any) {
          console.error(err.message);
          process.exit(1);
        }
      }
    )
    .command(
      "set <controller> <name>",
      "Set the controller address for a table",
      (yargs) =>
        yargs
          .positional("controller", {
            type: "string",
            description: "The target controller address",
          })
          .positional("name", {
            type: "string",
            description: "The target table name",
          }) as yargs.Argv<Options>,
      async (argv) => {
        const {
          name,
          controller,
          chain,
          privateKey,
          etherscan,
          infura,
          alchemy,
        } = argv;

        try {
          const signer = getWallet({
            privateKey,
            chain,
            infura,
            etherscan,
            alchemy,
          });
          const options: ConnectOptions = {
            chain,
            signer,
          };
          const res = await connect(options).setController(controller, name);
          const out = JSON.stringify(res, null, 2);
          console.log(out);
          process.exit(0);
        } catch (err: any) {
          console.error(err.message);
          process.exit(1);
        }
      }
    )
    .command(
      "lock <name>",
      "Lock the controller address for a table",
      (yargs) =>
        yargs.positional("name", {
          type: "string",
          description: "The target table name",
        }) as yargs.Argv<Options>,
      async (argv) => {
        const { name, chain, privateKey, etherscan, infura, alchemy } = argv;

        try {
          const signer = getWallet({
            privateKey,
            chain,
            infura,
            etherscan,
            alchemy,
          });
          const options: ConnectOptions = {
            chain,
            signer,
          };
          const res = await connect(options).lockController(name);
          const out = JSON.stringify(res, null, 2);
          console.log(out);
          process.exit(0);
        } catch (err: any) {
          console.error(err.message);
          process.exit(1);
        }
      }
    );

export const handler = async (argv: Arguments<Options>): Promise<void> => {
  // noop
};
