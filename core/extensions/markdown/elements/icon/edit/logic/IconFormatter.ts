import type { FormatterType } from "@ext/markdown/core/edit/logic/Formatter/Formatters/typeFormats/getFormatterType";
import type { NodeSerializerSpec } from "@ext/markdown/core/edit/logic/Prosemirror/to_markdown";

const IconFormatter =
	(formatter: FormatterType): NodeSerializerSpec =>
	(state, node) =>
		state.write(formatter.openTag("icon", { code: node.attrs.code, color: node.attrs.color }, true));

export default IconFormatter;
