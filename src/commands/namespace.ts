import type yargs from "yargs";
import { Arguments, CommandBuilder } from "yargs";
import { GlobalOptions } from "../cli.js";
import { setupCommand } from "../lib/commandSetup.js";

export interface Options extends GlobalOptions {
  domain: string;
  mappings: string[];
  record: string;
}

export const command = "namespace <domain> [mappings..]";
export const desc = "Manage ENS names for tables";

async function getHandler(argv: yargs.ArgumentsCamelCase<Options>) {
  const { record } = argv;
  const { ens } = await setupCommand(argv);
  if (!ens) {
    console.log(
      "You have no configured the tableland command for ENS correctly"
    );
    return;
  }

  console.log(await ens.resolveTable(record));
}

async function setHandler(argv: yargs.ArgumentsCamelCase<Options>) {
  const { domain, mappings } = argv;
  const { ens } = await setupCommand(argv);
  if (!ens) return;

  const records = mappings.map((entry: any) => {
    const [key, value] = entry.split("=");

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

  if (await ens.addTableRecords(domain, records)) {
    const response = {
      domain,
      records,
      mappings,
    };

    console.dir(response, { depth: null });
  }
}

export const builder: CommandBuilder<{}, Options> = (yargs) =>
  yargs
    .command(
      "get <record>",
      "Pass in a record to find it's table name",
      (yargs) =>
        yargs.positional("record", {
          type: "string",
          description: "The target table name",
        }) as yargs.Argv<Options>,
      getHandler
    )
    .command(
      "set <domain> [mappings..]",
      "Set text records for a namespace",
      (yargs) =>
        yargs
          .positional("domain", {
            type: "string",
            description: "Blah",
          })
          .positional("mappings", {}) as yargs.Argv<Options>,
      setHandler
    )
    .usage(``) as yargs.Argv<Options>;

export const handler = async (argv: Arguments<Options>): Promise<void> => {};
