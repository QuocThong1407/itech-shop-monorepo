"use client";

interface Section {
  id?: string | number;
  title?: string;
  content?: string;
}

interface StructuredDescription {
  type: "sections";
  sections: Section[];
}

// Bước 1: clean raw HTML string từ server trước khi xử lý
function preClean(raw: string): string {
  return (
    raw
      // \&quot; → " (escaped HTML entity dạng backslash)
      .replace(/\\&quot;/g, '"')
      .replace(/\\\"/g, '"')
  );
}

// Bước 2: tách sections từ raw string đã pre-clean
function parseDescription(raw: string): StructuredDescription | null {
  if (!raw) return null;
  const cleaned = preClean(raw);
  const pattern =
    /\{"id":[\d.]+,"title":"([^"]+)","content":"([\s\S]*?)(?="\},\{"id"|"\}]\})/g;
  const sections: Section[] = [];
  let match;
  while ((match = pattern.exec(cleaned)) !== null) {
    sections.push({ title: match[1], content: match[2] });
  }
  return sections.length > 0 ? { type: "sections", sections } : null;
}

// Bước 3: clean HTML bên trong từng section content
function cleanContent(html: string): string {
  return (
    html
      // xóa toàn bộ attributes trong tags — giữ tag name thôi
      .replace(/<(\/?)(\w+)[^>]*>/g, "<$1$2>")
      // xóa li rỗng
      .replace(/<li>\s*\\?n\s*<\/li>/g, "")
      .replace(/<li>\s*\n\s*<\/li>/g, "")
      .replace(/<li><\/li>/g, "")
      // xóa p rỗng
      .replace(/<p>\s*\\?n\s*<\/p>/g, "")
      .replace(/<p><\/p>/g, "")
      // xóa span (giữ content)
      .replace(/<\/?span>/g, "")
      // xóa \n literal
      .replace(/\\n/g, "")
      .trim()
  );
}

function decodeTitle(title: string): string {
  return title
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"');
}

function isBlank(html: string): boolean {
  return html.replace(/<[^>]*>/g, "").replace(/\s/g, "").length === 0;
}

export default function ProductDescription({
  description,
}: {
  description: string;
}) {
  const parsed = parseDescription(description);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6">
      <h2 className="text-base font-bold text-zinc-900 mb-4 pb-3 border-b border-zinc-100">
        Mô tả sản phẩm
      </h2>

      {parsed ? (
        <div className="flex flex-col gap-6">
          {parsed.sections
            .map((s) => ({ ...s, html: cleanContent(s.content ?? "") }))
            .filter((s) => !isBlank(s.html))
            .map((section, i) => (
              <div key={i}>
                {section.title && (
                  <h3 className="text-sm font-bold text-zinc-900 mb-3 flex items-center gap-2">
                    <span className="w-1 h-4 bg-blue-500 rounded-full inline-block shrink-0" />
                    {decodeTitle(section.title)}
                  </h3>
                )}
                <div
                  className="prose prose-sm prose-zinc max-w-none text-sm text-zinc-600 leading-relaxed
                    [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2 [&_ul]:mt-1
                    [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-2
                    [&_li]:text-zinc-600 [&_li]:leading-relaxed
                    [&_strong]:font-semibold [&_strong]:text-zinc-800
                    [&_p]:mb-2 [&_p:empty]:hidden
                    [&_div]:mb-1
                    [&_img]:rounded-lg [&_img]:max-w-full [&_img]:my-2"
                  dangerouslySetInnerHTML={{ __html: section.html }}
                />
              </div>
            ))}
        </div>
      ) : (
        <div
          className="prose prose-sm prose-zinc max-w-none text-sm text-zinc-600 leading-relaxed
            [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1
            [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1
            [&_li]:text-zinc-600 [&_strong]:font-semibold [&_strong]:text-zinc-800
            [&_p]:mb-3 [&_a]:text-blue-600 [&_a]:hover:underline
            [&_img]:rounded-lg [&_img]:max-w-full"
          dangerouslySetInnerHTML={{ __html: description }}
        />
      )}
    </div>
  );
}
