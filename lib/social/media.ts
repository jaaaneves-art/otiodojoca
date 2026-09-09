export const MEDIA_BUCKET = "social-message-media";
export const MAX_MEDIA_BYTES = 5 * 1024 * 1024;
export const MEDIA_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf", "video/mp4"];

// Basic signature validation, not a full decoder or malware scanner.
// Downloads are forced attachments and never rendered as HTML by the application.
export async function validateMessageFile(file: File): Promise<string | null> {
  if (file.size < 1 || file.size > MAX_MEDIA_BYTES || !MEDIA_TYPES.includes(file.type)) {
    return "Aceitamos JPG, PNG, WebP, PDF ou MP4 entre 1 byte e 5 MB.";
  }
  const bytes = new Uint8Array(await file.slice(0, 64).arrayBuffer());
  const ascii = (start: number, end: number) => String.fromCharCode(...bytes.slice(start, end));
  const matches = file.type === "image/jpeg" ? bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
    : file.type === "image/png" ? [137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => bytes[i] === v)
    : file.type === "image/webp" ? ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP"
    : file.type === "application/pdf" ? ascii(0, 5) === "%PDF-"
    : bytes.length >= 16 && ascii(4, 8) === "ftyp" && ["isom", "iso2", "mp41", "mp42", "avc1", "M4V ", "MSNV"].some(brand => {
      if (ascii(8, 12) === brand) return true;
      for (let i = 16; i + 4 <= bytes.length; i += 4) if (ascii(i, i + 4) === brand) return true;
      return false;
    });
  return matches ? null : "O conteúdo do ficheiro não corresponde ao formato indicado.";
}
