import SnippetEditorProps from "@ext/markdown/elements/snippet/edit/model/SnippetEditorProps.schema";
import { JSONContent } from "@tiptap/core";

interface SnippetEditData extends SnippetEditorProps {
	content: JSONContent;
}

export default SnippetEditData;
