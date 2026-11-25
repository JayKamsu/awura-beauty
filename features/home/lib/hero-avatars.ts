/** Photos des pastilles du hero : avis du site, puis visuels de secours. */
export function heroAvatarSources(
  items: ReadonlyArray<{ kind: string; imageUrl: string | null }>,
  fallback: readonly string[],
): string[] {
  const fromClients = [
    ...new Set(
      items
        .filter((item) => item.kind === "site" && item.imageUrl)
        .map((item) => item.imageUrl as string),
    ),
  ];
  const merged = [...fromClients];
  for (const src of fallback) {
    if (merged.length >= 3) break;
    if (!merged.includes(src)) merged.push(src);
  }
  return merged.slice(0, 3);
}
