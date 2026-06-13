"use client";

import { Editor } from "@tinymce/tinymce-react";
import { useRef } from "react";

type TinyMCEEditorProps = {
  value: string;
  onChange: (value: string) => void;
  onUploadedImages?: (url: string) => void;
  placeholder?: string;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000/api";

export default function TinyMCEEditor({
  value,
  onChange,
  onUploadedImages,
  placeholder = "Start writing...",
}: TinyMCEEditorProps) {
  const editorRef = useRef<any>(null);

  const handleUpload = async (
    blobInfo: any,
    progress: (value: number) => void,
  ) => {
    const file = new File([blobInfo.blob()], blobInfo.filename(), {
      type: blobInfo.blob().type,
    });

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Upload failed");
    }

    const payload = await response.json();
    const imageUrl = payload?.data?.url;

    if (!imageUrl) {
      throw new Error("Upload returned no URL");
    }

    onUploadedImages?.(imageUrl);
    progress(100);

    setTimeout(() => {
      if (editorRef.current) {
        onChange(editorRef.current.getContent());
      }
    }, 50);

    return imageUrl;
  };

  const handleFilePicker = (
    callback: (value: string, meta?: { title?: string }) => void,
  ) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = async (event) => {
      const target = event.target as HTMLInputElement;
      const file = target.files?.[0];
      if (!file) return;

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const payload = await response.json();
      const imageUrl = payload?.data?.url;
      if (!imageUrl) {
        throw new Error("Upload returned no URL");
      }

      onUploadedImages?.(imageUrl);
      callback(imageUrl, { title: file.name });

      setTimeout(() => {
        if (editorRef.current) {
          onChange(editorRef.current.getContent());
        }
      }, 50);
    };

    input.click();
  };

  return (
    <Editor
      apiKey="4gkfws4p2gh8h2xpr3p2i4xx289br8258bwr3tf98na06vpy"
      value={value}
      onEditorChange={onChange}
      onInit={(_, editor) => {
        editorRef.current = editor;
      }}
      init={{
        height: 560,
        menubar: false,
        branding: false,
        statusbar: true,
        resize: true,
        placeholder,
        skin: "oxide",
        content_css: "default",
        plugins: [
          "anchor",
          "autolink",
          "charmap",
          "code",
          "codesample",
          "emoticons",
          "image",
          "link",
          "lists",
          "media",
          "searchreplace",
          "table",
          "visualblocks",
          "wordcount",
        ],
        toolbar:
          "undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | bullist numlist | link image media table | align lineheight | removeformat code",
        automatic_uploads: true,
        file_picker_types: "image",
        images_upload_handler: handleUpload,
        file_picker_callback: (
          callback: (value: string, meta?: { title?: string }) => void,
          _value: string,
          meta: { filetype?: string },
        ) => {
          if (meta.filetype === "image") {
            handleFilePicker(callback);
          }
        },
        content_style: `
          body {
            font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            font-size: 16px;
            line-height: 1.7;
            color: #334155;
            padding: 16px;
            margin: 0;
          }
          p { margin: 0 0 1rem 0; }
          h1, h2, h3, h4, h5, h6 { margin: 1.25rem 0 0.75rem; }
          img { max-width: 100%; height: auto; }
        `,
        setup: (editor: any) => {
          editor.on("change", () => {
            onChange(editor.getContent());
          });
        },
      }}
    />
  );
}
