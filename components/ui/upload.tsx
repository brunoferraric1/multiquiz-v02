'use client';

import * as React from "react";
import { ImageIcon, UploadCloud } from "lucide-react";

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
      inputRef.current?.click();
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      handleSelect(event.dataTransfer.files);
    };

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
            <div className="relative w-full aspect-video">
              <img
                src={previewUrl}
                alt="Preview da imagem do quiz"
                className="h-full w-full object-cover"
              />
            </div>
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

        {previewUrl && (
          <Button
            type="button"
            variant="outline"
            className="w-full text-sm font-semibold"
            onClick={handleButtonClick}
          >
            <UploadCloud className="mr-2 h-4 w-4" />
            Trocar Imagem
          </Button>
        )}

        {file && (
          <p className="text-xs text-muted-foreground">{file.name}</p>
        )}
      </div>
    );
  }
);
Upload.displayName = "Upload";
