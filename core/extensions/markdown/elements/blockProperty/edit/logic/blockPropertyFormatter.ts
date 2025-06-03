import { FormatterType } from "@ext/markdown/core/edit/logic/Formatter/Formatters/typeFormats/getFormatterType";
import { NodeSerializerSpec } from "@ext/markdown/core/edit/logic/Prosemirror/to_markdown";

const blockPropertyFormatter =
	(formatter: FormatterType): NodeSerializerSpec =>
	async (state, node) => {
		state.write(
			formatter.openTag("block-property", { bind: node.attrs.bind, placeholder: node.attrs.placeholder }),
		);
		state.write("\n\n");
		if (node.content.childCount > 0) await state.renderContent(node);
		else state.write("\n\n");
		state.write(formatter.closeTag("block-property"));
		state.closeBlock(node);
	};

export default blockPropertyFormatter;
