"use client";

import { useRef } from "react";
import type { PropertyImage } from "@/lib/types";

const MAX_FILES = 10;
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png"];

interface ImageUploaderProps {
  /** Images already saved in DB (edit mode) */
  existingImages: PropertyImage[];
  /** Local files chosen but not yet uploaded */
  pendingFiles: File[];
  onAddFiles: (files: File[]) => void;
  onRemoveExisting: (imageId: string) => void;
  onRemovePending: (index: number) => void;
}

export function ImageUploader({
  existingImages,
  pendingFiles,
  onAddFiles,
  onRemoveExisting,
  onRemovePending,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const totalCount = existingImages.length + pendingFiles.length;
  const remaining = MAX_FILES - totalCount;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = Array.from(e.target.files ?? []);
    // Reset input so same file can be re-selected after removal
    if (inputRef.current) inputRef.current.value = "";

    const valid: File[] = [];
    const errors: string[] = [];

    for (const file of raw) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        errors.push(`${file.name}: only JPG and PNG are allowed`);
        continue;
      }
      if (file.size > MAX_BYTES) {
        errors.push(`${file.name}: exceeds 5 MB limit`);
        continue;
      }
      valid.push(file);
    }

    const allowed = valid.slice(0, remaining);
    if (allowed.length > 0) onAddFiles(allowed);

    if (errors.length > 0) {
      // Surface validation errors via a native alert — acceptable for agent-only tooling
      alert(errors.join("\n"));
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Image grid */}
      {totalCount > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {existingImages.map((img, i) => (
            <div key={img.id} className="relative aspect-square rounded-[10px] overflow-hidden bg-sand-dark">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.image_url}
                alt={`Photo ${i + 1}`}
                className="w-full h-full object-cover"
              />
              {img.is_primary && (
                <span className="absolute bottom-1 left-1 text-[9px] font-semibold bg-primary text-white rounded px-1 py-0.5 leading-none">
                  Primary
                </span>
              )}
              <button
                type="button"
                onClick={() => onRemoveExisting(img.id)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-narra/70 text-white text-[10px] flex items-center justify-center leading-none active:scale-90 transition-transform"
                aria-label="Remove photo"
              >
                ✕
              </button>
            </div>
          ))}

          {pendingFiles.map((file, i) => (
            <div key={`pending-${i}`} className="relative aspect-square rounded-[10px] overflow-hidden bg-sand-dark">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={URL.createObjectURL(file)}
                alt={`New photo ${i + 1}`}
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-1 left-1 text-[9px] font-semibold bg-ocean text-white rounded px-1 py-0.5 leading-none">
                New
              </span>
              <button
                type="button"
                onClick={() => onRemovePending(i)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-narra/70 text-white text-[10px] flex items-center justify-center leading-none active:scale-90 transition-transform"
                aria-label="Remove photo"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add photos button */}
      {remaining > 0 && (
        <>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-full border-2 border-dashed border-sand-dark rounded-[12px] py-3 text-sm text-muted flex items-center justify-center gap-2 active:bg-sand transition-colors duration-100"
          >
            <span aria-hidden="true">📷</span>
            {totalCount === 0 ? "Add photos" : `Add more (${remaining} remaining)`}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
        </>
      )}

      <p className="text-[10px] text-muted">
        JPG or PNG · max 5 MB per photo · up to {MAX_FILES} photos
      </p>
    </div>
  );
}
