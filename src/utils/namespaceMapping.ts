import { sqlparser } from "./fake.js";

export async function resolveNamespace(statement: string, resolver: any) {
  const tables: string[] = (await sqlparser.normalize(statement)).tables;

  // @ts-ignore
  const tableMapping = Object.fromEntries(new Map(tables.map(resolver))); 

  const finalStatement = (await sqlparser.normalize(statement, {
    nameMapping: tableMapping
  }));

  return finalStatement;
}
