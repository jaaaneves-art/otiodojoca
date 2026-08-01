"use client";

import { useState, useRef } from "react";
import { sendMessage } from "@/app/mercado-da-terra/messages/actions";

const MAX_ATTACHMENTS = 3;
const MAX_SIZE_MB = 10;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

export default function MessageForm({ conversationId }: { conversationId: number }) {
  const [content, setContent] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const fileArray = Array.from(files);
    setError("");

    if (attachments.length + fileArray.length > MAX_ATTACHMENTS) {
      setError(`Máximo ${MAX_ATTACHMENTS} anexos por mensagem`);
      return;
    }

    for (const file of fileArray) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError("Apenas imagens (JPG, PNG, WEBP) e PDF são permitidos");
        return;
      }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        setError(`Máximo ${MAX_SIZE_MB}MB por ficheiro`);
        return;
      }
    }

    setAttachments([...attachments, ...fileArray]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if ((!content.trim() && attachments.length === 0) || sending) return;

    setSending(true);
    const formData = new FormData();
    formData.append("conversationId", conversationId.toString());
    formData.append("content", content);

    attachments.forEach((file, index) => {
      formData.append(`attachment_${index}`, file);
    });
    formData.append("attachment_count", attachments.length.toString());

    try {
      await sendMessage(formData);
      setContent("");
      setAttachments([]);
    } catch (err) {
      console.error("Erro ao enviar mensagem:", err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const form = e.currentTarget.form;
      if (form) form.requestSubmit();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      {/* Preview de anexos */}
      {attachments.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {attachments.map((file, index) => (
            <div key={index} className="relative group border border-terra-200 rounded-lg p-2 bg-terra-50 flex items-center gap-2">
              {file.type.startsWith("image/") ? (
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  className="w-10 h-10 object-cover rounded"
                />
              ) : (
                <div className="w-10 h-10 rounded bg-red-100 flex items-center justify-center text-lg">
                  📄
                </div>
              )}
              <span className="text-xs text-terra-700 max-w-[120px] truncate">{file.name}</span>
              <button
                type="button"
                onClick={() => removeAttachment(index)}
                className="text-red-500 hover:text-red-700 font-bold ml-1"
                title="Remover"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Erro */}
      {error && <p className="text-red-600 text-sm">{error}</p>}

      {/* Linha de input */}
      <div className="flex gap-2 items-end">
        {/* Botão anexar - colorido e legível */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={attachments.length >= MAX_ATTACHMENTS}
          className="flex items-center gap-1 bg-terra-100 text-terra-700 border border-terra-300 py-2 px-3 rounded-2xl hover:bg-terra-200 disabled:opacity-50 whitespace-nowrap"
          title="Anexar foto ou PDF"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
          </svg>
          <span className="text-sm font-medium">Anexar</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,application/pdf"
          onChange={handleFilesSelected}
          className="hidden"
        />

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder="Escreve uma mensagem..."
          className="flex-1 border border-terra-200 rounded-2xl px-4 py-2 focus:outline-none focus:border-terra-600 resize-none max-h-32"
        />

        <button
          type="submit"
          disabled={sending || (!content.trim() && attachments.length === 0)}
          className="bg-terra-600 text-white font-medium py-2 px-5 rounded-2xl hover:bg-terra-700 disabled:opacity-50"
        >
          {sending ? "..." : "Enviar"}
        </button>
      </div>
    </form>
  );
}
