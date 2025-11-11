import { FormatterType } from "@ext/markdown/core/edit/logic/Formatter/Formatters/typeFormats/getFormatterType";
import { NodeSerializerSpec } from "@ext/markdown/core/edit/logic/Prosemirror/to_markdown";

export const questionAnswerFormatter =
	(formatter: FormatterType): NodeSerializerSpec =>
	async (state, node) => {
		const attrs: Record<string, unknown> = {
			answerId: node.attrs.answerId,
		};

		if (node.attrs.correct) attrs.correct = "true";

		state.write(formatter.openTag("questionAnswer", attrs));
		state.write("\n\n");

		if (node.content.childCount > 0) await state.renderContent(node);
		else state.write("\n\n");

		state.write(formatter.closeTag("questionAnswer"));
		state.closeBlock(node);
	};
