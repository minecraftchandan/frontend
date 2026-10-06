import { useEffect, useRef, useState, type ImgHTMLAttributes } from "react";
import { apiFetch } from "@/lib/api";

type AuthenticatedImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "onError"> & {
  src: string;
  onError?: () => void;
};

export function AuthenticatedImage({ src, onError, ...props }: AuthenticatedImageProps) {
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;
  const [resolvedSrc, setResolvedSrc] = useState<string | null>(() => (
    new URL(src, typeof window === "undefined" ? "https://localhost" : window.location.href).pathname.startsWith("/api/media/")
      ? null
      : src
  ));
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const url = new URL(src, window.location.href);
    if (!url.pathname.startsWith("/api/media/")) {
      setResolvedSrc(src);
      setFailed(false);
      return;
    }

    const controller = new AbortController();
    let objectUrl: string | undefined;
    setResolvedSrc(null);
    setFailed(false);

    void apiFetch(url, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Photo request failed (${response.status}).`);
        return response.blob();
      })
      .then((blob) => {
        if (!controller.signal.aborted) {
          objectUrl = URL.createObjectURL(blob);
          setResolvedSrc(objectUrl);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setFailed(true);
          onErrorRef.current?.();
        }
      });

    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src]);

  if (failed) {
    return <div className="grid min-h-24 place-items-center text-sm text-muted-foreground" role="status">Evidence photo could not be loaded.</div>;
  }
  if (!resolvedSrc) return null;
  return (
    <img
      {...props}
      src={resolvedSrc}
      onError={() => {
        setFailed(true);
        onErrorRef.current?.();
      }}
    />
  );
}
