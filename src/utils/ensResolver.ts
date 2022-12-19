import ethers from 'ethers';

interface EnsResolverOptions {
  provider: ethers.providers.JsonRpcProvider
}

export default class EnsResolver {
  provider: ethers.providers.JsonRpcProvider;

  constructor(options: EnsResolverOptions) {
    this.provider = options.provider;
  }

  async resolveTable(tablename: string): Promise<string> {



    let [domain, textRecord] = tablename.split('.eth.');
  
    domain = domain + ".eth";
  
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
