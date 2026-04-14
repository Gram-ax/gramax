import type { FormatterType } from "@ext/markdown/core/edit/logic/Formatter/Formatters/typeFormats/getFormatterType";
import type { NodeSerializerSpec } from "@ext/markdown/core/edit/logic/Prosemirror/to_markdown";

const inlinePropertyFormatter =
	(formatter: FormatterType): NodeSerializerSpec =>
	(state, node) => {
		state.write(formatter.openTag("inline-property", { bind: node.attrs.bind }, true));
	};

export default inlinePropertyFormatter;
