export const sqlparser = {
  normalize: (statement: string, options?: any) => {
    if(options) {
      return {statement: "INSERT INTO blah blah ", tables: []}
    } else {
      console.log("Statement:", statement);
      return {tables: ["uno.dos.ens", "dos.dos.ens"]};
    }
  },
}
