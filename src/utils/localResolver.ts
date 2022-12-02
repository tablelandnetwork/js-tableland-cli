export async function localResolver(tablename: string) {
  const myLocalMap = {
    "uno.dos.ens": "ui_test_5_2",
    "dos.dos.ens": "ui_test_5_3"
  };

  // @ts-ignore
  return myLocalMap[tablename];
}
