import ethers from 'ethers';


function ensResolver(ensNamespace: string) {

}

export default async function resolveTable(tablename: string): Promise<string> {



  const [textRecord, ...domainArray] = tablename.split('.');

  const domain = domainArray.join(".");

  const provider = new ethers.providers.JsonRpcProvider(
    "https://goerli.infura.io/v3/92f6902cf1214401ae5b08a1e117eb91"
  );

  const address = await provider.getResolver(domain);

  console.log("Record", await address?.getText(textRecord));
  return await address?.getText(textRecord) || tablename;
}

export async function  resolveTables(tableNames: string[]) {
  const record: any = {};

  const resolvedTablenames = await Promise.all(tableNames.map(tableName => {
    return new Promise((resolve) => {
      (async () => {
        resolve([tableName, await resolveTable(tableName)]);
      })();      
      
    });
  }));

  
  console.log("Resy",resolvedTablenames);

  resolvedTablenames.forEach((table:any) => {
    record[table[0]] = table[1];
  });

  return record;
}
