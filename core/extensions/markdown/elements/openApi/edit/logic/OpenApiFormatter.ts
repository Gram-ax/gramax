import { NodeSerializerSpec } from "@ext/markdown/core/edit/logic/Prosemirror/to_markdown";
import OPEN_API_NAME from "@ext/markdown/elements/openApi/name";
import { FormatterType } from "@ext/markdown/core/edit/logic/Formatter/Formatters/typeFormats/getFormatterType";

const OpenApiFormatter =
	(formatter: FormatterType): NodeSerializerSpec =>
	(state, node) => {
		state.write(
			formatter.openTag(
				OPEN_API_NAME,
				{
					src: node.attrs.src,
					...(typeof node.attrs.flag === "boolean" ? { flag: `${node.attrs.flag}` } : {}),
				},
				true,
			),
		);
		state.closeBlock(node);
	};

export default OpenApiFormatter;
