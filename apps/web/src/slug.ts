export function toSlug(name: string): string {
  return name.replace(/[^a-zA-Z0-9 _-]/g, "").trim();
}
