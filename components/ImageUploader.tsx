"use client";

import { useRef, useState } from "react";
import imageCompression from "browser-image-compression";
import type { PropertyImage } from "@/lib/types";

const MAX_FILES = 10;
/** Maximum size per photo AFTER compression (AC7) */
const MAX_BYTES_AFTER_COMPRESSION = 1 * 1024 * 1024; // 1 MB

interface ImageUploaderProps {
  /** Images already saved in DB (edit mode) */
  existingImages: PropertyImage[];
  /** Local files chosen but not yet uploaded */
  pendingFiles: File[];
  onAddFiles: (files: File[]) => void;
  onRemoveExisting: (imageId: string) => void;
  onRemovePending: (index: number) => void;
  /** AC5 — reorder existing image up (-1) or down (+1) within the existingImages array */
  onReorderExisting: (index: number, dir: -1 | 1) => void;
  /** AC5 — reorder pending file up (-1) or down (+1) within the pendingFiles array */
  onReorderPending: (index: number, dir: -1 | 1) => void;
}

export function ImageUploader({
  existingImages,
  pendingFiles,
  onAddFiles,
  onRemoveExisting,
  onRemovePending,
  onReorderExisting,
  onReorderPending,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionError, setCompressionError] = useState<string | null>(null);

  const totalCount = existingImages.length + pendingFiles.length;
  const remaining = MAX_FILES - totalCount;

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = Array.from(e.target.files ?? []);
    // Reset so the same file can be re-selected after removal
    if (inputRef.current) inputRef.current.value = "";

    setCompressionError(null);

    // Reject non-image files immediately (AC9 — accept="image/*" catches most, belt-and-suspenders here)
    const imageFiles = raw.filter((f) => f.type.startsWith("image/"));
    if (imageFiles.length < raw.length) {
      setCompressionError("Only image files are allowed.");
    }
    if (imageFiles.length === 0) return;

    setIsCompressing(true);
    const compressed: File[] = [];
    const errors: string[] = [];

    for (const file of imageFiles) {
      try {
        const result = await imageCompression(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 2048,
          useWebWorker: true,
          fileType: "image/jpeg",
        });

        if (result.size > MAX_BYTES_AFTER_COMPRESSION) {
          // AC7 edge case — still too large after compression
          errors.push(`${file.name}: still exceeds 1 MB after compression. Try a smaller image.`);
          continue;
        }

        // browser-image-compression may return a Blob — cast to File to preserve name
        const named = result instanceof File
          ? result
          : new File([result], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" });

        compressed.push(named);
      } catch {
        errors.push(`${file.name}: compression failed. Try again.`);
      }
    }

    setIsCompressing(false);

    const allowed = compressed.slice(0, remaining);
    if (allowed.length > 0) onAddFiles(allowed);

    if (errors.length > 0) {
      setCompressionError(errors.join(" · "));
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Image grid — AC5: up/down reorder controls on each tile */}
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
              {/* AC5 — reorder buttons */}
              <div className="absolute top-1 left-1 flex flex-col gap-0.5">
                {i > 0 && (
                  <button
                    type="button"
                    onClick={() => onReorderExisting(i, -1)}
                    className="w-5 h-5 rounded bg-narra/70 text-white text-[10px] flex items-center justify-center leading-none active:scale-90 transition-transform"
                    aria-label="Move photo up"
                  >
                    ▲
                  </button>
                )}
                {i < existingImages.length - 1 && (
                  <button
                    type="button"
                    onClick={() => onReorderExisting(i, 1)}
                    className="w-5 h-5 rounded bg-narra/70 text-white text-[10px] flex items-center justify-center leading-none active:scale-90 transition-transform"
                    aria-label="Move photo down"
                  >
                    ▼
                  </button>
                )}
              </div>
              {/* Remove button */}
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
              {/* AC5 — reorder buttons for pending files */}
              <div className="absolute top-1 left-1 flex flex-col gap-0.5">
                {i > 0 && (
                  <button
                    type="button"
                    onClick={() => onReorderPending(i, -1)}
                    className="w-5 h-5 rounded bg-narra/70 text-white text-[10px] flex items-center justify-center leading-none active:scale-90 transition-transform"
                    aria-label="Move photo up"
                  >
                    ▲
                  </button>
                )}
                {i < pendingFiles.length - 1 && (
                  <button
                    type="button"
                    onClick={() => onReorderPending(i, 1)}
                    className="w-5 h-5 rounded bg-narra/70 text-white text-[10px] flex items-center justify-center leading-none active:scale-90 transition-transform"
                    aria-label="Move photo down"
                  >
                    ▼
                  </button>
                )}
              </div>
              {/* Remove button */}
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

      {/* AC8 — compression in-progress indicator */}
      {isCompressing && (
        <p className="text-xs text-muted flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 border-2 border-muted border-t-primary rounded-full animate-spin" />
          Compressing photos…
        </p>
      )}

      {/* AC7 edge case — compression error */}
      {compressionError && (
        <p className="text-xs text-primary">{compressionError}</p>
      )}

      {/* Add photos button */}
      {remaining > 0 && (
        <>
          <button
            type="button"
            disabled={isCompressing}
            onClick={() => inputRef.current?.click()}
            className="w-full border-2 border-dashed border-sand-dark rounded-[12px] py-3 text-sm text-muted flex items-center justify-center gap-2 active:bg-sand transition-colors duration-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span aria-hidden="true">📷</span>
            {isCompressing
              ? "Compressing…"
              : totalCount === 0
              ? "Add photos"
              : `Add more (${remaining} remaining)`}
          </button>
          {/* AC9 — accept="image/*" so iOS/Android camera picker appears */}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
        </>
      )}

      <p className="text-[10px] text-muted">
        JPG, PNG, HEIC · compressed to max 1 MB · up to {MAX_FILES} photos
      </p>
    </div>
  );
}
