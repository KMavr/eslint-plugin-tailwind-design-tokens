export const makeAllowMatcher = (entries: string[] = []) => {
  const exact = new Set<string>();
  const regexes: RegExp[] = [];

  entries.forEach((entry) => {
    const m = /^\/(.+)\/([a-z]*)$/.exec(entry);
    if (m) {
      regexes.push(new RegExp(m[1], m[2]));
    } else {
      exact.add(entry);
    }
  });

  return (value: string) => exact.has(value) || regexes.some((re) => re.test(value));
};
