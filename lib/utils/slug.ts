export function slugify(text: string): string {
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");
}

export function generateSlug(title: string, id?: number): string {
  const base = slugify(title);
  return id ? `${base}-${id}` : `${base}-${Date.now()}`;
}
