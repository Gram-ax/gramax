import { FormatterType } from "@ext/markdown/core/edit/logic/Formatter/Formatters/typeFormats/getFormatterType";
import { NodeSerializerSpec } from "@ext/markdown/core/edit/logic/Prosemirror/to_markdown";

const SnippetFormatter =
	(formatter: FormatterType): NodeSerializerSpec =>
	(state, node) => {
		state.write(formatter.openTag("snippet", { id: node.attrs.id }, true));
		state.closeBlock(node);
	};

export default SnippetFormatter;
