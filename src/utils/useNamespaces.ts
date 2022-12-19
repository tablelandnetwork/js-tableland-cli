export function mergeNamespaces(maps: Record<string, string>[]): Record<string, string> {
  const final: Record<string, string> = {};

  maps.forEach(map => {
    for (const name in map) {
      if(final[name]) {
        throw new Error(`Namespace conflict: ${name} exists on multiple namespaces. Please full qualifiy.`);
      } else {
        final[name] = map[name];
      }
    }
  })

  return final;
}

