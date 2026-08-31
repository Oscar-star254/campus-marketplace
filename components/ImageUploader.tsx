"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabaseClient";

const MAX_IMAGES = 4;

export default function ImageUploader({
  onChange,
}: {
  onChange: (urls: string[]) => void;
}) {
  const supabase = createClient();
  const [urls, setUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || !fileList.length) return;
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("You need to be logged in to upload photos.");
      return;
    }

    const files = Array.from(fileList).slice(0, MAX_IMAGES - urls.length);
    if (!files.length) return;

    setUploading(true);
    const newUrls: string[] = [];

    for (const file of files) {
      if (!file.type.startsWith("image/")) continue;
      if (file.size > 5 * 1024 * 1024) {
        setError("Each photo needs to be under 5MB.");
        continue;
      }

      const ext = file.name.split(".").pop();
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("listing-images")
        .upload(path, file);

      if (uploadError) {
        setError(uploadError.message);
        continue;
      }

      const { data } = supabase.storage.from("listing-images").getPublicUrl(path);
      newUrls.push(data.publicUrl);
    }

    const updated = [...urls, ...newUrls];
    setUrls(updated);
    onChange(updated);
    setUploading(false);
  }

  function removeImage(url: string) {
    const updated = urls.filter((u) => u !== url);
    setUrls(updated);
    onChange(updated);
  }

  return (
    <div>
      <label>Photos (up to {MAX_IMAGES})</label>
      <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", marginBottom: "0.6rem" }}>
        {urls.map((url) => (
          <div key={url} style={{ position: "relative" }}>
            <img
              src={url}
              alt=""
              style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 10, border: "1px solid var(--line)" }}
            />
            <button
              type="button"
              onClick={() => removeImage(url)}
              style={{
                position: "absolute", top: -6, right: -6, width: 20, height: 20, padding: 0,
                borderRadius: "50%", fontSize: "0.7rem", lineHeight: "20px", background: "var(--coral)",
              }}
              aria-label="Remove photo"
            >
              ×
            </button>
          </div>
        ))}
        {urls.length < MAX_IMAGES && (
          <label
            style={{
              width: 80, height: 80, borderRadius: 10, border: "1px dashed var(--line)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "var(--ink-soft)", fontSize: "0.78rem", textAlign: "center",
            }}
          >
            {uploading ? "..." : "+ Add"}
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleFiles(e.target.files)}
              style={{ display: "none" }}
              disabled={uploading}
            />
          </label>
        )}
      </div>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
