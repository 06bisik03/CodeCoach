export function stripComments(code: string) {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "")
    .trim();
}

export function isLikelyPlaceholderCode(code: string) {
  const normalizedCode = stripComments(code);
  const nonEmptyLines = normalizedCode
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (nonEmptyLines.length === 0) {
    return true;
  }

  if (/\b(todo|fixme|pass)\b/i.test(normalizedCode)) {
    return true;
  }

  if (
    /throw\s+new\s+Error\s*\(\s*["'`](?:todo|not implemented|implement)/i.test(
      normalizedCode,
    )
  ) {
    return true;
  }

  const hasTraversalLogic =
    /\b(for|while|forEach|map|filter|reduce|find|some|every|sort)\b/.test(
      normalizedCode,
    );
  const hasLiteralReturn =
    /\breturn\s+(?:-?\d+(?:\.\d+)?|true|false|null|undefined|["'`][^"'`]*["'`]|(?:\[[^\]]*\])|(?:\{[^}]*\}))\s*;?/m.test(
      normalizedCode,
    );

  return !hasTraversalLogic && hasLiteralReturn && nonEmptyLines.length <= 6;
}
