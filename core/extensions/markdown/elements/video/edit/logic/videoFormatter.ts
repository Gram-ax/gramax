import { FormatterType } from "@ext/markdown/core/edit/logic/Formatter/Formatters/typeFormats/getFormatterType";
import { NodeSerializerSpec } from "@ext/markdown/core/edit/logic/Prosemirror/to_markdown";

const videoFormatter =
	(formatter: FormatterType): NodeSerializerSpec =>
	(state, node) => {
		state.write(formatter.openTag("video", { path: node.attrs.path, title: node.attrs.title }, true));
		state.closeBlock(node);
	};

export default videoFormatter;
