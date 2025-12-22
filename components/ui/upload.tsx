'use client';

import * as React from "react";
import { ImageIcon, Trash2, UploadCloud, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type UploadProps = React.HTMLAttributes<HTMLDivElement> & {
  file?: File | null;
  previewUrl?: string;
  onFileChange: (file: File | null) => void;
  accept?: string;
};

export const Upload = React.forwardRef<HTMLDivElement, UploadProps>(
  ({ className, file, previewUrl, onFileChange, accept, ...props }, ref) => {
    const inputRef = React.useRef<HTMLInputElement>(null);

    const handleSelect = (files: FileList | null) => {
      const selectedFile = files && files.length > 0 ? files[0] : null;
      onFileChange(selectedFile);
    };

    const handleButtonClick = () => {
      setIsPreviewViewerOpen(false);
      inputRef.current?.click();
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      handleSelect(event.dataTransfer.files);
    };

    const handleRemoveImage = () => {
      setIsPreviewViewerOpen(false);
      onFileChange(null);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    };

    const [isPreviewViewerOpen, setIsPreviewViewerOpen] = React.useState(false);

    React.useEffect(() => {
      if (!isPreviewViewerOpen) {
        return;
      }

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          setIsPreviewViewerOpen(false);
        }
      };

      document.addEventListener("keydown", handleKeyDown);
      return () => {
        document.removeEventListener("keydown", handleKeyDown);
      };
    }, [isPreviewViewerOpen]);

    React.useEffect(() => {
      if (!previewUrl) {
        setIsPreviewViewerOpen(false);
      }
    }, [previewUrl]);

    return (
      <div ref={ref} className={cn("space-y-2", className)} {...props}>
        <div
          data-upload-area
          className={cn(
            "group relative rounded-2xl border border-dashed border-border/60 bg-muted/60 transition hover:bg-muted/70 focus-visible:border-[#fbbf24]",
            previewUrl
              ? "overflow-hidden cursor-pointer"
              : "flex flex-col h-32 cursor-pointer items-center justify-center px-4 py-3 text-center"
          )}
          onClick={previewUrl ? undefined : handleButtonClick}
          onDrop={handleDrop}
          onDragOver={(event) => event.preventDefault()}
          onDragEnter={(event) => event.preventDefault()}
        >
          {previewUrl ? (
            <button
              type="button"
              className="relative aspect-video w-full overflow-hidden rounded-2xl border-none p-0 cursor-[var(--cursor-interactive)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              onClick={() => setIsPreviewViewerOpen(true)}
              aria-label="Abrir imagem em tela cheia"
            >
              <img
                src={previewUrl}
                alt="Preview da imagem do quiz"
                className="block h-full w-full object-cover"
              />
            </button>
          ) : (
            <>
              <div className="flex flex-col items-center gap-1 text-muted-foreground mb-2">
                <ImageIcon className="h-6 w-6" />
                <p className="text-xs font-semibold">Arraste ou solte uma imagem aqui</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs font-semibold"
                onClick={(e) => {
                  e.stopPropagation();
                  handleButtonClick();
                }}
              >
                <UploadCloud className="mr-2 h-3 w-3" />
                Fazer Upload de Imagem
              </Button>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(event) => handleSelect(event.target.files)}
          />
        </div>

        {previewUrl && isPreviewViewerOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 px-4 py-6"
            role="dialog"
            aria-modal="true"
            aria-label="Visualização da imagem em tamanho maior"
            onClick={() => setIsPreviewViewerOpen(false)}
          >
            <div
              className="relative max-h-full max-w-full"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                className="absolute right-0 top-0 inline-flex cursor-[var(--cursor-interactive)] items-center justify-center rounded-full bg-card/80 p-2 text-foreground shadow-lg transition hover:bg-card focus-visible:outline-none"
                onClick={() => setIsPreviewViewerOpen(false)}
                aria-label="Fechar visualização"
              >
                <X size={16} />
              </button>
              <img
                src={previewUrl}
                alt="Preview da imagem do quiz em tamanho maior"
                className="max-h-[90vh] w-auto rounded-2xl object-contain shadow-2xl"
              />
            </div>
          </div>
        )}

        {previewUrl && (
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="w-full text-sm font-semibold sm:flex-1"
              onClick={handleButtonClick}
            >
              <UploadCloud className="mr-2 h-4 w-4" />
              Trocar Imagem
            </Button>
            <Button
              type="button"
              variant="outline-destructive"
              className="w-full text-sm font-semibold sm:flex-1"
              onClick={handleRemoveImage}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Remover Imagem
            </Button>
          </div>
        )}

        {file && (
          <p className="text-xs text-muted-foreground">{file.name}</p>
        )}
      </div>
    );
  }
);
Upload.displayName = "Upload";
