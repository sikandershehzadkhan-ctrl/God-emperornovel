import React, { useEffect } from "react";
import { createRoot } from "react-dom/client";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

function safeHttpUrl(value) {
  try {
    const url = new URL(String(value || "").trim());
    return ["http:", "https:"].includes(url.protocol) && !!url.hostname && !url.username && !url.password
      ? url.href
      : null;
  } catch {
    return null;
  }
}

function normalizeNode(node) {
  if (node.type === "text") {
    const result = { type: "text", text: String(node.text || "") };
    const marks = (node.marks || []).map(mark => {
      if (mark.type === "link") {
        const href = safeHttpUrl(mark.attrs?.href);
        return href ? { type: "link", attrs: { href } } : null;
      }
      return { type: mark.type };
    }).filter(Boolean);
    if (marks.length) result.marks = marks;
    return result;
  }

  const result = { type: node.type };
  if (node.type === "heading") result.attrs = { level: Number(node.attrs?.level) };
  if (node.type === "orderedList") {
    const start = Number(node.attrs?.start || 1);
    if (start !== 1) result.attrs = { start };
  }
  if (Array.isArray(node.content)) result.content = node.content.map(normalizeNode);
  return result;
}

function serialize(editor) {
  return JSON.stringify({
    type: "imperial_rich_text_chapter",
    version: 1,
    doc: normalizeNode(editor.getJSON())
  });
}

function ToolbarButton({ editor, label, active, disabled, onClick, children }) {
  return (
    <button
      className={"authorEditorTool" + (active ? " is-active" : "")}
      type="button"
      aria-label={label}
      aria-pressed={active ? "true" : "false"}
      title={label}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function AuthorChapterEditor({ onChange }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        codeBlock: false,
        link: { openOnClick: false, autolink: false, linkOnPaste: false }
      })
    ],
    content: { type: "doc", content: [{ type: "paragraph" }] },
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "authorEditorCanvas",
        role: "textbox",
        "aria-label": "Chapter content",
        "aria-multiline": "true",
        spellcheck: "true",
        dir: "auto"
      }
    },
    onUpdate: ({ editor: current }) => onChange(serialize(current), current.getText().length)
  });

  useEffect(() => {
    if (editor) onChange(serialize(editor), editor.getText().length);
  }, [editor, onChange]);

  if (!editor) return <div className="authorEditorLoading" role="status">Preparing the chapter editor…</div>;

  const tools = [
    { label: "Bold", active: editor.isActive("bold"), run: () => editor.chain().focus().toggleBold().run(), icon: "B" },
    { label: "Italic", active: editor.isActive("italic"), run: () => editor.chain().focus().toggleItalic().run(), icon: "I" },
    { label: "Underline", active: editor.isActive("underline"), run: () => editor.chain().focus().toggleUnderline().run(), icon: "U" },
    { label: "Strikethrough", active: editor.isActive("strike"), run: () => editor.chain().focus().toggleStrike().run(), icon: "S" },
    { label: "Inline code", active: editor.isActive("code"), run: () => editor.chain().focus().toggleCode().run(), icon: "</>" },
    { label: "Heading 2", active: editor.isActive("heading", { level: 2 }), run: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), icon: "H2" },
    { label: "Heading 3", active: editor.isActive("heading", { level: 3 }), run: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), icon: "H3" },
    { label: "Paragraph", active: editor.isActive("paragraph"), run: () => editor.chain().focus().setParagraph().run(), icon: "¶" },
    { label: "Bullet list", active: editor.isActive("bulletList"), run: () => editor.chain().focus().toggleBulletList().run(), icon: "• List" },
    { label: "Numbered list", active: editor.isActive("orderedList"), run: () => editor.chain().focus().toggleOrderedList().run(), icon: "1. List" },
    { label: "Blockquote", active: editor.isActive("blockquote"), run: () => editor.chain().focus().toggleBlockquote().run(), icon: "❝" },
    { label: "Horizontal rule", active: false, run: () => editor.chain().focus().setHorizontalRule().run(), icon: "―" },
    { label: "Undo", active: false, disabled: !editor.can().chain().focus().undo().run(), run: () => editor.chain().focus().undo().run(), icon: "↶" },
    { label: "Redo", active: false, disabled: !editor.can().chain().focus().redo().run(), run: () => editor.chain().focus().redo().run(), icon: "↷" }
  ];

  const addLink = () => {
    const previous = editor.getAttributes("link").href || "";
    const entered = window.prompt("Enter an HTTP or HTTPS link", previous);
    if (entered === null) return;
    if (!entered.trim()) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    const href = safeHttpUrl(entered);
    if (!href) {
      window.alert("Use a valid HTTP or HTTPS address without embedded credentials.");
      return;
    }
    editor.chain().focus().setLink({ href }).run();
  };

  return (
    <section className="authorEditorShell" aria-label="Rich-text chapter editor">
      <div className="authorEditorToolbar" role="toolbar" aria-label="Chapter formatting">
        {tools.map(tool => (
          <ToolbarButton
            key={tool.label}
            editor={editor}
            label={tool.label}
            active={tool.active}
            disabled={tool.disabled}
            onClick={tool.run}
          >
            {tool.icon}
          </ToolbarButton>
        ))}
        <ToolbarButton
          editor={editor}
          label="Add or edit link"
          active={editor.isActive("link")}
          onClick={addLink}
        >
          Link
        </ToolbarButton>
      </div>
      <EditorContent editor={editor} />
      <p className="authorEditorHint" role="note">
        Formatting is saved as structured text. Images and embedded HTML are not supported in this editor.
      </p>
    </section>
  );
}

export function mountAuthorChapterEditor(element, options = {}) {
  const root = createRoot(element);
  const onChange = typeof options.onChange === "function" ? options.onChange : () => {};
  root.render(<AuthorChapterEditor onChange={onChange} />);
  return () => root.unmount();
}
