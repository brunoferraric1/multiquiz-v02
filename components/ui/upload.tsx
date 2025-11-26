'use client';

import * as React from "react";
import { ImageIcon, UploadCloud } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type UploadProps = React.HTMLAttributes<HTMLDivElement> & {
  file?: File | null;
  previewUrl?: string;
  onFileChange: (file: File | null) => void;
};

export const Upload = React.forwardRef<HTMLDivElement, UploadProps>(
  ({ className, file, previewUrl, onFileChange, ...props }, ref) => {
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
          className="group relative flex h-32 cursor-pointer items-center justify-center rounded-2xl border border-dashed border-border/60 bg-muted/60 px-4 text-center transition hover:bg-muted/70 focus-visible:border-[#fbbf24]"
          onClick={handleButtonClick}
          onDrop={handleDrop}
          onDragOver={(event) => event.preventDefault()}
          onDragEnter={(event) => event.preventDefault()}
        >
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Preview da imagem do quiz"
              className="h-full w-full rounded-xl object-cover"
            />
          ) : (
            <div className="flex flex-col items-center gap-1 text-muted-foreground">
              <ImageIcon className="h-6 w-6" />
              <p className="text-xs font-semibold">Nenhuma imagem selecionada</p>
              <p className="text-[11px]">Arraste ou solte um arquivo aqui</p>
            </div>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => handleSelect(event.target.files)}
          />
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full text-sm font-semibold"
          onClick={handleButtonClick}
        >
          <UploadCloud className="mr-2 h-4 w-4" />
          Fazer Upload de Imagem
        </Button>

        {file && (
          <p className="text-xs text-muted-foreground">{file.name}</p>
        )}
      </div>
    );
  }
);
Upload.displayName = "Upload";
