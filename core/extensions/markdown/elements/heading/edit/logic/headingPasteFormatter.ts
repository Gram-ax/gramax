import { Node } from "@tiptap/pm/model";
import { EditorState } from "@tiptap/pm/state";

const headingPasteFormatter = (state: EditorState, heading: Node) =>
	state.schema.nodes.paragraph.createChecked(heading.attrs, heading.content, heading.marks);

export default headingPasteFormatter;
