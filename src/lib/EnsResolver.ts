import ethers, { Signer } from "ethers";
import { ENS } from "@ensdomains/ensjs";

interface EnsResolverOptions {
  provider: ethers.providers.JsonRpcProvider;
  signer?: Signer;
}

interface TableMap {
  key: string;
  value: string;
}

export default class EnsResolver {
  provider: ethers.providers.JsonRpcProvider;
  signer: Signer | undefined;
  ENS: ENS;
  ready: Promise<boolean>;

  constructor(options: EnsResolverOptions) {
    this.signer = options.signer;
    this.provider = options.provider;
    this.ENS = new ENS();
    const getReady = async () => {
      this.ENS.setProvider(this.provider);
      return true;
    };
    this.ready = getReady();
  }

  async resolveTable(tablename: string): Promise<string> {
    const [textRecord, ...domainArray] = tablename.split(".");

    const domain = domainArray.join(".");

    const address = await this.provider.getResolver(domain);

    return (await address?.getText(textRecord)) || tablename;
  }

  async isOwner(domain: string) {
    await this.ready;
    if (this.signer === undefined) throw new Error("No signer");
    try {
      const record = await this.ENS.getOwner(domain);
      if (record?.owner === (await this.signer.getAddress())) {
        return true;
      }
    } catch (e) {
      return false;
    }
  }

  async addTableRecords(domain: string, maps: TableMap[]) {
    try {
      await this.ready;

      await this.ENS.setRecords(domain, {
        records: {
          texts: maps,
        },
        // @ts-ignore
        signer: this.signer,
      });
      return true;
    } catch (e: any) {
      console.log("Adding table to ENS failed");
      console.error(e.message);
    }
    return false;
  }

  async resolve(statement: string): Promise<string> {
    const tableNames: string[] = await globalThis.sqlparser.getUniqueTableNames(
      statement
    );
    const record: any = {};

    const resolvedTablenames = await Promise.all(
      tableNames.map((tableName) => {
        return new Promise((resolve) => {
          (async () => {
            resolve([tableName, await this.resolveTable(tableName)]);
          })();
        });
      })
    );

    resolvedTablenames.forEach((table: any) => {
      record[table[0]] = table[1];
    });

    const statements = await globalThis.sqlparser.normalize(statement, record);

    const finalStatement = statements.statements.join(";");

    return finalStatement;
  }
}
