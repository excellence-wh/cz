/** 把任意字符串转成 URL 友好的 slug。 */
export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** 首字母大写。 */
export function capitalize(input: string): string {
  if (input.length === 0) return input;
  return input.charAt(0).toUpperCase() + input.slice(1);
}

/** 把字符串截断到指定长度并追加省略号。 */
export function truncate(input: string, maxLength: number, ellipsis = "…"): string {
  if (maxLength < 0) throw new RangeError("maxLength 不能为负数");
  if (input.length <= maxLength) return input;
  if (maxLength <= ellipsis.length) return ellipsis.slice(0, maxLength);
  return input.slice(0, maxLength - ellipsis.length) + ellipsis;
}
