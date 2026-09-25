import { ArrowDownTray, Spinner, XMark } from "@medusajs/icons";
import { IconButton, Text, clx } from "@medusajs/ui";
import { ChangeEvent, DragEvent, useRef, useState } from "react";
import { formatFileSize } from "@lib/format-file-size";
import { compressImage } from "@mercurjs/dashboard-shared";

export interface FileType {
  id: string;
  url: string;
  file: File;
}

export interface FileUploadProps {
  label: string;
  multiple?: boolean;
  hint?: string;
  hasError?: boolean;
  formats: string[];
  onUploaded: (files: FileType[]) => void;
  onRemove?: () => void;
  uploadedImage?: string | null;
  fileName?: string;
  fileSize?: number;
}

export const FileUpload = ({
  label,
  hint,
  multiple = true,
  hasError,
  formats,
  onUploaded,
  onRemove,
  uploadedImage = "",
  fileName,
  fileSize,
}: FileUploadProps) => {
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLButtonElement>(null);

  const handleOpenFileSelector = () => {
    if (isProcessing) return;
    inputRef.current?.click();
  };

  const handleDragEnter = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const files = event.dataTransfer?.files;
    if (!files) {
      return;
    }

    setIsDragOver(true);
  };

  const handleDragLeave = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (
      !dropZoneRef.current ||
      dropZoneRef.current.contains(event.relatedTarget as Node)
    ) {
      return;
    }

    setIsDragOver(false);
  };

  const handleUploaded = async (files: FileList | null) => {
    if (!files) {
      return;
    }

    setIsProcessing(true);
    try {
      const fileList = Array.from(files);
      const processedFiles = await Promise.all(
        fileList.map((file) => compressImage(file))
      );

      const fileObj = processedFiles.map((file) => {
        const id = Math.random().toString(36).substring(7);
        const previewUrl = URL.createObjectURL(file);
        return {
          id,
          url: previewUrl,
          file,
        };
      });

      onUploaded(fileObj);
    } catch {
      const fileList = Array.from(files);
      const fileObj = fileList.map((file) => {
        const id = Math.random().toString(36).substring(7);
        const previewUrl = URL.createObjectURL(file);
        return {
          id,
          url: previewUrl,
          file,
        };
      });
      onUploaded(fileObj);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();

    setIsDragOver(false);

    if (!isProcessing) {
      handleUploaded(event.dataTransfer?.files);
    }
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    handleUploaded(event.target.files);
  };

  const showFileRow = !multiple && uploadedImage;

  if (showFileRow) {
    return (
      <div>
        <div className="bg-ui-bg-component shadow-borders-base flex items-center gap-x-3 rounded-lg p-3">
          <div className="flex h-10 w-[30px] shrink-0 items-center justify-center overflow-hidden rounded-md">
            <img
              src={uploadedImage}
              alt={fileName}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex flex-1 flex-col">
            <Text size="small" leading="compact" weight="plus">
              {fileName || "image"}
            </Text>
            {fileSize != null && (
              <Text
                size="small"
                leading="compact"
                className="text-ui-fg-subtle"
              >
                {formatFileSize(fileSize)}
              </Text>
            )}
          </div>
          {onRemove && (
            <IconButton
              type="button"
              variant="transparent"
              size="small"
              onClick={onRemove}
            >
              <XMark />
            </IconButton>
          )}
        </div>
        <input
          hidden
          aria-label="File upload"
          ref={inputRef}
          onChange={handleFileChange}
          type="file"
          accept={formats.join(",")}
          multiple={false}
        />
      </div>
    );
  }

  return (
    <div>
      <button
        ref={dropZoneRef}
        type="button"
        disabled={isProcessing}
        onClick={handleOpenFileSelector}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        className={clx(
          "bg-ui-bg-component border-ui-border-strong transition-fg group flex w-full flex-col items-center gap-y-2 rounded-lg border border-dashed p-8",
          "hover:border-ui-border-interactive focus:border-ui-border-interactive",
          "focus:shadow-borders-focus outline-none focus:border-solid",
          {
            "!border-ui-border-error": hasError,
            "!border-ui-border-interactive": isDragOver,
            "opacity-75 cursor-wait": isProcessing,
          },
        )}
      >
        {isProcessing ? (
          <div className="text-ui-fg-subtle flex items-center gap-x-2">
            <Spinner className="animate-spin" />
            <Text>Optimizing images...</Text>
          </div>
        ) : (
          <>
            <div className="text-ui-fg-subtle group-disabled:text-ui-fg-disabled flex items-center gap-x-2">
              <ArrowDownTray />
              <Text>{label}</Text>
            </div>
            {!!hint && (
              <Text
                size="small"
                leading="compact"
                className="text-ui-fg-muted group-disabled:text-ui-fg-disabled"
              >
                {hint}
              </Text>
            )}
          </>
        )}
      </button>
      <input
        hidden
        aria-label="File upload"
        ref={inputRef}
        onChange={handleFileChange}
        type="file"
        accept={formats.join(",")}
        multiple={multiple}
      />
    </div>
  );
};
