import { NodeSerializerSpec } from "@ext/markdown/core/edit/logic/Prosemirror/to_markdown";
import { NoteType } from "@ext/markdown/elements/note/render/component/Note";

export const GFMAlerts: Record<string, NoteType> = {
	"[!NOTE]": NoteType.info,
	"[!TIP]": NoteType.tip,
	"[!WARNING]": NoteType.note,
	"[!CAUTION]": NoteType.danger,
	"[!IMPORTANT]": NoteType.lab,
};

const BLOCKQUOTE = "> ";
const h3Title = "### ";

const noteFormatter: NodeSerializerSpec = async (state, node) => {
	const type = Object.entries(GFMAlerts).find(([, v]) => v === node.attrs.type)?.[0];
	if (type) state.write(`${BLOCKQUOTE}${type}\n`);

	const title = node.attrs.title;
	if (title) state.write(`${BLOCKQUOTE}${h3Title}${title}\n`);
	else if (type) state.write(`${BLOCKQUOTE}\n`);

	await state.wrapBlock(`${BLOCKQUOTE}`, null, node, () => state.renderContent(node));
};

export default noteFormatter;
