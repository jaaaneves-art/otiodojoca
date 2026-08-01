"use client";

import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";

interface ImageCropperProps {
  imageSrc: string;
  onCropComplete: (croppedBlob: Blob) => void;
  onCancel: () => void;
}

interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Função para criar imagem cropada a partir do canvas
async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  rotation: number = 0
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("No 2d context");
  }

  const rotRad = (rotation * Math.PI) / 180;

  // Calcular novo bounding box
  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
    image.width,
    image.height,
    rotation
  );

  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  // Rotacionar
  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.translate(-image.width / 2, -image.height / 2);
  ctx.drawImage(image, 0, 0);

  // Extrair área cropada
  const croppedCanvas = document.createElement("canvas");
  const croppedCtx = croppedCanvas.getContext("2d");

  if (!croppedCtx) {
    throw new Error("No 2d context");
  }

  croppedCanvas.width = pixelCrop.width;
  croppedCanvas.height = pixelCrop.height;

  croppedCtx.drawImage(
    canvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve) => {
    croppedCanvas.toBlob((blob) => {
      if (blob) resolve(blob);
    }, "image/jpeg", 0.9);
  });
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.src = url;
  });
}

function rotateSize(width: number, height: number, rotation: number) {
  const rotRad = (rotation * Math.PI) / 180;
  return {
    width: Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height: Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
}

export default function ImageCropper({ imageSrc, onCropComplete, onCancel }: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [aspect, setAspect] = useState<number | undefined>(4 / 3);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);

  const onCropChange = useCallback((location: { x: number; y: number }) => {
    setCrop(location);
  }, []);

  const onZoomChange = useCallback((zoom: number) => {
    setZoom(zoom);
  }, []);

  const onCropAreaChange = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    
    setProcessing(true);
    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
      onCropComplete(croppedBlob);
    } catch (e) {
      console.error("Erro ao cortar:", e);
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-white p-4 border-b border-terra-200 flex items-center justify-between">
        <h2 className="text-lg font-bold text-terra-900">✂️ Editar Imagem</h2>
        <button
          type="button"
          onClick={onCancel}
          className="text-terra-600 hover:text-terra-900 text-2xl"
        >
          ✕
        </button>
      </div>

      {/* Cropper */}
      <div className="flex-1 relative bg-terra-900">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={aspect}
          onCropChange={onCropChange}
          onZoomChange={onZoomChange}
          onCropComplete={onCropAreaChange}
        />
      </div>

      {/* Controles */}
      <div className="bg-white p-4 border-t border-terra-200">
        {/* Aspect ratio */}
        <div className="mb-3">
          <label className="text-sm font-medium text-terra-700 block mb-2">Formato:</label>
          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setAspect(4 / 3)}
              className={`px-3 py-1 rounded-lg text-sm ${aspect === 4 / 3 ? "bg-terra-600 text-white" : "bg-terra-100 text-terra-700"}`}
            >
              4:3
            </button>
            <button
              type="button"
              onClick={() => setAspect(1)}
              className={`px-3 py-1 rounded-lg text-sm ${aspect === 1 ? "bg-terra-600 text-white" : "bg-terra-100 text-terra-700"}`}
            >
              1:1 (quadrado)
            </button>
            <button
              type="button"
              onClick={() => setAspect(16 / 9)}
              className={`px-3 py-1 rounded-lg text-sm ${aspect === 16 / 9 ? "bg-terra-600 text-white" : "bg-terra-100 text-terra-700"}`}
            >
              16:9
            </button>
            <button
              type="button"
              onClick={() => setAspect(undefined)}
              className={`px-3 py-1 rounded-lg text-sm ${aspect === undefined ? "bg-terra-600 text-white" : "bg-terra-100 text-terra-700"}`}
            >
              Livre
            </button>
          </div>
        </div>

        {/* Zoom */}
        <div className="mb-3">
          <label className="text-sm font-medium text-terra-700 block mb-1">
            Zoom: {zoom.toFixed(1)}x
          </label>
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Botões */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleRotate}
            className="flex-1 border border-terra-200 text-terra-700 font-medium py-2 px-4 rounded-lg hover:bg-terra-50"
          >
            🔄 Rodar 90°
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 border border-terra-200 text-terra-700 font-medium py-2 px-4 rounded-lg hover:bg-terra-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={processing}
            className="flex-1 bg-terra-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-terra-700 disabled:opacity-50"
          >
            {processing ? "A processar..." : "✓ Aplicar"}
          </button>
        </div>
      </div>
    </div>
  );
}
