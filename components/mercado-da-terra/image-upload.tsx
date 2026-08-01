"use client";

import { useState, useRef } from "react";
import ImageCropper from "@/components/mercado-da-terra/image-cropper";

interface ExistingPhoto {
  id: number;
  storage_path: string;
  sort_order: number;
}

interface ImageUploadProps {
  onFilesSelected: (files: File[]) => void;
  onExistingRemoved?: (removedIds: number[]) => void;
  existingPhotos?: ExistingPhoto[];
  maxFiles?: number;
  maxSizeMB?: number;
}

interface EditingState {
  type: "new" | "existing";
  index?: number;         // para "new"
  existingId?: number;    // para "existing"
  imageSrc: string;
  fileName: string;
}

export default function ImageUpload({ 
  onFilesSelected, 
  onExistingRemoved,
  existingPhotos = [],
  maxFiles = 5, 
  maxSizeMB = 5 
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [removedExistingIds, setRemovedExistingIds] = useState<number[]>([]);
  const [error, setError] = useState<string>("");
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [loadingImage, setLoadingImage] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const visibleExisting = existingPhotos.filter(p => !removedExistingIds.includes(p.id));
  const totalPhotos = visibleExisting.length + selectedFiles.length;

  const validateFiles = (files: File[]): boolean => {
    if (totalPhotos + files.length > maxFiles) {
      setError(`Máximo ${maxFiles} imagens permitidas`);
      return false;
    }

    for (const file of files) {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        setError("Apenas JPG, PNG e WEBP permitidos");
        return false;
      }

      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(`Máximo ${maxSizeMB}MB por imagem`);
        return false;
      }
    }

    return true;
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;

    const fileArray = Array.from(files);
    
    if (!validateFiles(fileArray)) {
      return;
    }

    setError("");
    const newFiles = [...selectedFiles, ...fileArray];
    setSelectedFiles(newFiles);
    onFilesSelected(newFiles);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const removeNewFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    onFilesSelected(newFiles);
  };

  const removeExisting = (id: number) => {
    const newRemoved = [...removedExistingIds, id];
    setRemovedExistingIds(newRemoved);
    if (onExistingRemoved) {
      onExistingRemoved(newRemoved);
    }
  };

  // Editar nova imagem (do state)
  const handleEditNew = (index: number) => {
    const file = selectedFiles[index];
    setEditing({
      type: "new",
      index,
      imageSrc: URL.createObjectURL(file),
      fileName: file.name,
    });
  };

  // Editar imagem existente (fazer fetch primeiro)
  const handleEditExisting = async (photo: ExistingPhoto) => {
    setLoadingImage(photo.id);
    try {
      // Fazer fetch da imagem do storage
      const response = await fetch(photo.storage_path);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      
      // Extrair nome do ficheiro do URL
      const urlParts = photo.storage_path.split("/");
      const fileName = urlParts[urlParts.length - 1] || `foto-${photo.id}.jpg`;

      setEditing({
        type: "existing",
        existingId: photo.id,
        imageSrc: objectUrl,
        fileName,
      });
    } catch (e) {
      console.error("Erro ao carregar imagem para editar:", e);
      setError("Não foi possível carregar a imagem para editar");
    } finally {
      setLoadingImage(null);
    }
  };

  const handleCropComplete = (croppedBlob: Blob) => {
    if (!editing) return;

    const newFile = new File([croppedBlob], editing.fileName, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });

    if (editing.type === "new" && editing.index !== undefined) {
      // Substituir na lista de novas imagens
      const newFiles = [...selectedFiles];
      newFiles[editing.index] = newFile;
      setSelectedFiles(newFiles);
      onFilesSelected(newFiles);
    } else if (editing.type === "existing" && editing.existingId !== undefined) {
      // Marcar existente para remover + adicionar editada como nova
      const newRemoved = [...removedExistingIds, editing.existingId];
      setRemovedExistingIds(newRemoved);
      if (onExistingRemoved) {
        onExistingRemoved(newRemoved);
      }

      const newFiles = [...selectedFiles, newFile];
      setSelectedFiles(newFiles);
      onFilesSelected(newFiles);
    }

    setEditing(null);
  };

  const handleCancelEdit = () => {
    setEditing(null);
  };

  return (
    <div className="w-full">
      <label className="text-sm font-medium block mb-3">Imagens</label>

      {/* Imagens existentes */}
      {visibleExisting.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-medium text-terra-800 mb-2">
            Imagens atuais ({visibleExisting.length})
          </p>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
            {visibleExisting.map((photo) => (
              <div key={photo.id} className="relative group">
                <img
                  src={photo.storage_path}
                  alt={`Foto ${photo.sort_order + 1}`}
                  className="w-full h-24 object-cover rounded-lg border border-terra-200"
                />
                {/* Overlay de loading */}
                {loadingImage === photo.id && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                    <p className="text-white text-xs">A carregar...</p>
                  </div>
                )}
                {/* Botões: editar + remover */}
                <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button
                    type="button"
                    onClick={() => handleEditExisting(photo)}
                    disabled={loadingImage !== null}
                    className="bg-terra-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs disabled:opacity-50"
                    title="Editar imagem"
                  >
                    ✂️
                  </button>
                  <button
                    type="button"
                    onClick={() => removeExisting(photo.id)}
                    className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                    title="Remover imagem"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Zona de Drop */}
      {totalPhotos < maxFiles && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition ${
            isDragging
              ? "border-terra-600 bg-terra-50"
              : "border-terra-300 bg-terra-50 hover:border-terra-400"
          }`}
        >
          <div className="text-4xl mb-3">📸</div>
          <p className="font-medium text-terra-900 mb-1">
            Arrasta imagens aqui ou clica para selecionar
          </p>
          <p className="text-sm text-terra-600">
            JPG, PNG ou WEBP • Máx {maxSizeMB}MB • {maxFiles - totalPhotos} restante{maxFiles - totalPhotos === 1 ? "" : "s"}
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileInput}
            className="hidden"
          />
        </div>
      )}

      {/* Erro */}
      {error && (
        <p className="text-red-600 text-sm mt-2">{error}</p>
      )}

      {/* Preview novas imagens */}
      {selectedFiles.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-medium text-terra-800 mb-2">
            Novas imagens ({selectedFiles.length})
          </p>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
            {selectedFiles.map((file, index) => (
              <div key={index} className="relative group">
                <img
                  src={URL.createObjectURL(file)}
                  alt={`Nova ${index + 1}`}
                  className="w-full h-24 object-cover rounded-lg border-2 border-green-400"
                />
                <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button
                    type="button"
                    onClick={() => handleEditNew(index)}
                    className="bg-terra-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                    title="Editar imagem"
                  >
                    ✂️
                  </button>
                  <button
                    type="button"
                    onClick={() => removeNewFile(index)}
                    className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                    title="Remover"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-xs text-terra-600 mt-1 truncate">
                  {file.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de edição */}
      {editing && (
        <ImageCropper
          imageSrc={editing.imageSrc}
          onCropComplete={handleCropComplete}
          onCancel={handleCancelEdit}
        />
      )}
    </div>
  );
}
