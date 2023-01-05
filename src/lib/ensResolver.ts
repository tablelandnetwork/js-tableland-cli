import ethers, { Signer } from 'ethers';
import { ENS } from '@ensdomains/ensjs'

interface EnsResolverOptions {
  provider: ethers.providers.JsonRpcProvider,
  signer: Signer
}

export default class EnsResolver {
  provider: ethers.providers.JsonRpcProvider;
  signer: Signer;

  constructor(options: EnsResolverOptions) {
    this.signer = options.signer;
    this.provider = options.provider;
  }

  async resolveTable(tablename: string): Promise<string> {


    const ENSInstance = new ENS()
    await ENSInstance.setProvider(this.provider)

    // console.log(await ENSInstance.setRecords("tables.alllenmuncy.eth", {
    //   records: {
    //     texts:  [{
    //       "key":"tester",
    //       "value": "ui_test_5_2"
    //     }]
    //   },
    //   // @ts-ignore
    //   signer: this.signer
    // }))

    const [textRecord, ...domainArray] = tablename.split('.');

    const domain = domainArray.join(".");

    const address = await this.provider.getResolver(domain);


    return await address?.getText(textRecord) || tablename;
  }


  async resolve(statement:string): Promise<string> {


    const tableNames: string[] = await globalThis.sqlparser.getUniqueTableNames(statement);
    const record: any = {};

    const resolvedTablenames = await Promise.all(tableNames.map(tableName => {
      return new Promise((resolve) => {
        (async () => {
          resolve([tableName, await this.resolveTable(tableName)]);
        })();      

      });
    }));



    resolvedTablenames.forEach((table:any) => {
      record[table[0]] = table[1];
    });

    const statements = await globalThis.sqlparser.normalize(statement, record);

    const finalStatement = statements.statements.join(";");

    return finalStatement;
  }


}
