import { getDefaultProvider } from "ethers";

const provider = getDefaultProvider("goerli");

async function main() {

  const resolver = await provider.getResolver('tables.alllenmuncy.eth');

  console.log(await resolver.getText("prim"));

}

main();
