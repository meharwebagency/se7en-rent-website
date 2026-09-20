"use client";

import * as React from "react";
import {
  ArrowLeft,
  ArrowRight,
  ImagePlus,
  Star,
  Trash2,
  UploadCloud,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { Dictionary } from "@/i18n/dictionaries";

const ACCEPTED_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ACCEPT_ATTR = "image/jpeg,image/png,image/webp,image/avif";

export interface CarImageDraft {
  key: string;
  /** id of an existing car_images row (absent for staged new files) */
  id?: string;
  /** public URL of an existing image (absent for staged new files) */
  url?: string;
  /** staged file waiting to be uploaded on submit */
  file?: File;
  /** object URL used for live preview of staged files */
  preview?: string;
}

interface CarImagesManagerProps {
  dict: Dictionary["admin"];
  drafts: CarImageDraft[];
  onChange: (drafts: CarImageDraft[]) => void;
  disabled?: boolean;
}

function IconButton({
  title,
  onClick,
  disabled,
  children,
}: {
  title: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
    >
      {children}
    </button>
  );
}

export function CarImagesManager({
  dict,
  drafts,
  onChange,
  disabled,
}: CarImagesManagerProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = React.useState(false);
  const [fileError, setFileError] = React.useState<string | null>(null);

  // Revoke every live object URL on unmount. The set is kept in sync with the
  // current drafts inside an effect; removeDraft also revokes its URL eagerly.
  const cleanupRef = React.useRef<Set<string>>(new Set());
  React.useEffect(() => {
    cleanupRef.current = new Set(
      drafts
        .filter((d) => d.preview)
        .map((d) => d.preview as string),
    );
  });
  React.useEffect(
    () => () => cleanupRef.current.forEach((url) => URL.revokeObjectURL(url)),
    [],
  );

  function update(next: CarImageDraft[]) {
    onChange(next);
  }

  function addFiles(list: FileList | File[]) {
    const incoming = Array.from(list);
    if (incoming.length === 0) return;

    const valid: File[] = [];
    let problem: string | null = null;
    for (const file of incoming) {
      if (!ACCEPTED_MIMES.has(file.type)) {
        problem = dict.cars.wrongType;
        continue;
      }
      if (file.size > MAX_FILE_BYTES) {
        problem = dict.cars.tooLarge;
        continue;
      }
      valid.push(file);
    }

    setFileError(problem);
    if (valid.length === 0) return;

    const added: CarImageDraft[] = valid.map((file) => ({
      key: `new-${crypto.randomUUID()}`,
      file,
      preview: URL.createObjectURL(file),
    }));
    update([...drafts, ...added]);
  }

  function removeDraft(key: string) {
    const target = drafts.find((d) => d.key === key);
    if (target?.preview) URL.revokeObjectURL(target.preview);
    update(drafts.filter((d) => d.key !== key));
  }

  function move(key: string, dir: -1 | 1) {
    const i = drafts.findIndex((d) => d.key === key);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= drafts.length) return;
    const next = [...drafts];
    const [item] = next.splice(i, 1);
    next.splice(j, 0, item);
    update(next);
  }

  function setCover(key: string) {
    const i = drafts.findIndex((d) => d.key === key);
    if (i <= 0) return;
    const next = [...drafts];
    const [item] = next.splice(i, 1);
    next.unshift(item);
    update(next);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (disabled) return;
    addFiles(e.dataTransfer.files);
  }

  return (
    <div className="space-y-3">
      {drafts.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {drafts.map((draft, index) => (
            <li
              key={draft.key}
              className={cn(
                "group relative overflow-hidden rounded-xl border bg-secondary",
                index === 0 ? "border-accent" : "border-border",
              )}
            >
              {draft.preview || draft.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={draft.preview ?? draft.url}
                  alt=""
                  className="aspect-[4/3] w-full object-cover"
                />
              ) : null}
              {index === 0 ? (
                <span className="absolute start-1.5 top-1.5 inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-accent-foreground">
                  <Star className="h-3 w-3" />
                  {dict.cars.cover}
                </span>
              ) : null}
              <div className="flex items-center gap-1 border-t border-border bg-card p-1.5">
                <IconButton
                  title={dict.cars.setCover}
                  onClick={() => setCover(draft.key)}
                  disabled={disabled || index === 0}
                >
                  <Star className="h-3.5 w-3.5" />
                </IconButton>
                <IconButton
                  title={dict.cars.moveLeft}
                  onClick={() => move(draft.key, -1)}
                  disabled={disabled || index === 0}
                >
                  <ArrowLeft className="h-3.5 w-3.5 rtl:-scale-x-100" />
                </IconButton>
                <IconButton
                  title={dict.cars.moveRight}
                  onClick={() => move(draft.key, 1)}
                  disabled={disabled || index === drafts.length - 1}
                >
                  <ArrowRight className="h-3.5 w-3.5 rtl:-scale-x-100" />
                </IconButton>
                <button
                  type="button"
                  title={dict.cars.removeImage}
                  onClick={() => removeDraft(draft.key)}
                  disabled={disabled}
                  className="ms-auto inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:pointer-events-none disabled:opacity-40"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="flex h-20 items-center justify-center gap-2 rounded-xl border border-dashed border-border text-sm text-muted-foreground">
          <ImagePlus className="h-4 w-4" />
          {dict.cars.noImage}
        </p>
      )}

      <div
        onDragOver={(e) => {
          if (disabled) return;
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => {
          if (!disabled) inputRef.current?.click();
        }}
        onKeyDown={(e) => {
          if (!disabled && (e.key === "Enter" || e.key === " ")) {
            inputRef.current?.click();
          }
        }}
        role="button"
        tabIndex={0}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed px-4 py-6 text-center transition-colors",
          dragOver
            ? "border-accent bg-accent/5"
            : "border-border hover:bg-secondary/60",
          disabled ? "cursor-not-allowed opacity-50" : "",
        )}
      >
        <UploadCloud className="h-6 w-6 text-muted-foreground" />
        <p className="text-sm font-medium">{dict.cars.dropHint}</p>
        <p className="text-xs text-muted-foreground">{dict.cars.imageSpecs}</p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_ATTR}
          multiple
          className="hidden"
          disabled={disabled}
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {fileError ? (
        <p role="alert" className="text-sm text-destructive">
          {fileError}
        </p>
      ) : null}
    </div>
  );
}