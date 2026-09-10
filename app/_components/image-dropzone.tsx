"use client";

import { useId, useRef, useState } from "react";
import { ImagePlus, Upload, X } from "lucide-react";

const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
const DEFAULT_MAX_SIZE = 2 * 1024 * 1024; // 2MB

const labelClass = "text-xs font-semibold text-zinc-900 sm:text-sm";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

type Props = {
  name?: string;
  label?: string;
  initialUrl?: string | null;
  error?: string;
  required?: boolean;
  helpText?: string;
  onFileChange?: (file: File | null) => void;
  maxSize?: number;
};

export function ImageDropzone({
  name = "image",
  label = "Gambar",
  initialUrl = null,
  error,
  required = false,
  helpText,
  onFileChange,
  maxSize = DEFAULT_MAX_SIZE,
}: Props) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(initialUrl);
  const [isDragging, setIsDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const message = localError ?? error;

  function acceptFile(f: File | undefined | null) {
    setLocalError(null);
    if (!f) {
      setFile(null);
      onFileChange?.(null);
      return;
    }
    if (!ALLOWED_MIME.includes(f.type)) {
      setLocalError("Format harus JPG, PNG, atau WEBP.");
      return;
    }
    if (f.size > maxSize) {
      setLocalError(`Ukuran file terlalu besar (maks ${formatBytes(maxSize)}).`);
      return;
    }
    setFile(f);
    onFileChange?.(f);
    if (preview && preview.startsWith("blob:")) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(f));
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    acceptFile(e.target.files?.[0]);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) acceptFile(dropped);
  }

  function handleRemove() {
    if (preview && preview.startsWith("blob:")) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(initialUrl ?? null);
    setLocalError(null);
    onFileChange?.(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      <label htmlFor={inputId} className={`mb-1 block ${labelClass}`}>
        {label}
        {required && <span className="ml-0.5 text-rose-600">*</span>}
      </label>

      {preview ? (
        <div className="relative overflow-hidden rounded-md border border-zinc-200 bg-zinc-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Preview"
            className="mx-auto h-44 w-full object-contain sm:h-52"
          />
          <div className="flex items-center justify-between gap-2 border-t border-zinc-200 bg-white px-2.5 py-2">
            <p className="truncate text-[11px] text-zinc-600 sm:text-xs">
              {file ? `${file.name} · ${formatBytes(file.size)}` : "Gambar saat ini"}
            </p>
            <div className="flex shrink-0 gap-1.5">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-1 text-[11px] font-medium text-zinc-700 transition hover:bg-zinc-200 sm:text-xs"
              >
                <Upload className="size-3" />
                Ganti
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-1 text-[11px] font-medium text-rose-700 transition hover:bg-rose-100 sm:text-xs"
              >
                <X className="size-3" />
                Hapus
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed px-4 py-7 text-center transition sm:py-9 ${
            isDragging
              ? "border-indigo-500 bg-indigo-50/60"
              : "border-zinc-200 bg-zinc-50 hover:border-indigo-400 hover:bg-indigo-50/40"
          }`}
        >
          <div className="flex size-10 items-center justify-center rounded-full bg-white text-indigo-500 shadow-sm ring-1 ring-zinc-200/60 sm:size-12">
            <ImagePlus className="size-4 sm:size-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-zinc-900 sm:text-sm">
              {isDragging
                ? "Lepaskan untuk unggah"
                : "Seret & lepas gambar di sini"}
            </p>
            <p className="mt-0.5 text-[11px] text-zinc-500 sm:text-xs">
              atau klik untuk pilih file · JPG/PNG/WEBP · maks{" "}
              {formatBytes(maxSize)}
            </p>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        name={name}
        accept={ALLOWED_MIME.join(",")}
        required={required && !preview}
        onChange={handleInputChange}
        className="hidden"
      />

      {helpText && !message && (
        <p className="mt-1 text-[11px] text-zinc-500 sm:text-xs">{helpText}</p>
      )}
      {message && (
        <p className="mt-1 text-xs text-rose-600 sm:text-sm">{message}</p>
      )}
    </div>
  );
}
