"use client";

import { useEffect, useState } from "react";
import { ImagePlus } from "lucide-react";

export function AdminFilePreview({
  name,
  accept,
  required,
  label = "Choisir une image",
  hint = "JPG, PNG ou WebP uniquement. SVG refuse pour les produits.",
}: {
  name: string;
  accept: string;
  required?: boolean;
  label?: string;
  hint?: string;
}) {
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  return (
    <label className="grid gap-2 rounded-control border border-dashed border-white/15 bg-white/[0.035] p-3 text-sm text-white/70">
      <span className="inline-flex items-center gap-2 font-black text-white">
        <ImagePlus size={16} />
        {label}
      </span>
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview}
          alt=""
          className="h-28 w-full rounded-[8px] bg-white object-contain p-2"
        />
      ) : (
        <span className="grid h-28 place-items-center rounded-[8px] bg-white/[0.045] text-xs text-white/40">
          Preview apres selection
        </span>
      )}
      <input
        type="file"
        name={name}
        accept={accept}
        required={required}
        className="rounded-control border border-white/10 bg-white/[0.05] p-2 text-sm text-white"
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          setPreview((current) => {
            if (current) URL.revokeObjectURL(current);
            return file ? URL.createObjectURL(file) : null;
          });
        }}
      />
      <span className="text-xs text-white/38">{hint}</span>
    </label>
  );
}
