import { FormatterType } from "@ext/markdown/core/edit/logic/Formatter/Formatters/typeFormats/getFormatterType";
import { NodeSerializerSpec } from "@ext/markdown/core/edit/logic/Prosemirror/to_markdown";
import { NoteType } from "@ext/markdown/elements/note/render/component/Note";

const noteFormatter =
	(formatter: FormatterType): NodeSerializerSpec =>
	async (state, node) => {
		state.write(
			`${formatter.openTag("note", {
				type: node.attrs.type !== NoteType.note ? node.attrs.type : "",
				title: node.attrs.title,
				collapsed: node.attrs.collapsed == true ? "true" : "",
			})}\n\n`,
		);
		await state.renderContent(node);
		state.write(formatter.closeTag("note"));
		state.closeBlock(node);
	};

export default noteFormatter;
