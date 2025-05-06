import { FormatterType } from "@ext/markdown/core/edit/logic/Formatter/Formatters/typeFormats/getFormatterType";
import { NodeSerializerSpec } from "@ext/markdown/core/edit/logic/Prosemirror/to_markdown";

const drawioFormatter =
	(formatter: FormatterType): NodeSerializerSpec =>
	(state, node) => {
		state.write(
			formatter.openTag(
				"drawio",
				{
					path: node.attrs.src,
					title: node.attrs.title,
					width: node.attrs.width,
					height: node.attrs.height,
				},
				true,
			),
		);
		state.closeBlock(node);
	};

export default drawioFormatter;
