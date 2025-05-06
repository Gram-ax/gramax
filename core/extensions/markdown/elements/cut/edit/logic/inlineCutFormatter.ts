import { FormatterType } from "@ext/markdown/core/edit/logic/Formatter/Formatters/typeFormats/getFormatterType";
import { NodeSerializerSpec } from "@ext/markdown/core/edit/logic/Prosemirror/to_markdown";

const inlineCutFormatter =
	(formatter: FormatterType): NodeSerializerSpec =>
	async (state, node) => {
		state.write(formatter.openTag("cut", { text: node.attrs.text, expanded: node.attrs.expanded }));
		await state.renderContent(node);
		state.write(formatter.closeTag("cut"));
	};

export default inlineCutFormatter;
