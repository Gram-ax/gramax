import { FormatterType } from "@ext/markdown/core/edit/logic/Formatter/Formatters/typeFormats/getFormatterType";
import { NodeSerializerSpec } from "@ext/markdown/core/edit/logic/Prosemirror/to_markdown";

export const questionFormatter =
	(formatter: FormatterType): NodeSerializerSpec =>
	async (state, node) => {
		const attrs: Record<string, unknown> = { id: node.attrs.id, type: node.attrs.type };
		if (node.attrs.required) attrs.required = "true";

		state.write(formatter.openTag("question", attrs));
		state.write("\n\n");

		if (node.content.childCount > 0) await state.renderContent(node);
		else state.write("\n\n");

		state.write(formatter.closeTag("question"));
		state.closeBlock(node);
	};
