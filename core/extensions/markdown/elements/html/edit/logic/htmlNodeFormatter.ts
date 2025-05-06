import { FormatterType } from "@ext/markdown/core/edit/logic/Formatter/Formatters/typeFormats/getFormatterType";
import { NodeSerializerSpec } from "@ext/markdown/core/edit/logic/Prosemirror/to_markdown";

const htmlNodeFormatter =
	(formatter: FormatterType): NodeSerializerSpec =>
	(state, node) => {
		state.write(`${formatter.openTag("html", { mode: node.attrs.mode })}\n\n`);
		state.text(node.attrs.content, false);
		state.write(`\n\n`);
		state.write(formatter.closeTag("html"));
		state.closeBlock(node);
	};

export default htmlNodeFormatter;
