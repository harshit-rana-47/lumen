import type { EditorThemeClasses } from "lexical";

export const journalEditorTheme: EditorThemeClasses = {
  paragraph: "journal-p",
  quote: "journal-quote",
  heading: {
    h1: "journal-h1",
    h2: "journal-h2",
    h3: "journal-h3"
  },
  list: {
    ul: "journal-ul",
    ol: "journal-ol",
    listitem: "journal-li",
    nested: {
      listitem: "journal-li-nested"
    },
    checklist: "journal-checklist",
    listitemChecked: "journal-li-checked",
    listitemUnchecked: "journal-li-unchecked"
  },
  link: "journal-link",
  text: {
    bold: "font-semibold",
    italic: "italic",
    underline: "underline",
    strikethrough: "line-through",
    underlineStrikethrough: "underline line-through"
  }
};
