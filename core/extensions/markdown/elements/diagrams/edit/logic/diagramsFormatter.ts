import { NodeSerializerSpec } from "../../../../core/edit/logic/Prosemirror/to_markdown";
import { FormatterType } from "@ext/markdown/core/edit/logic/Formatter/Formatters/typeFormats/getFormatterType";

const DiagramsFormatter =
	(formatter: FormatterType): NodeSerializerSpec =>
	(state, node) => {
		if (node.attrs.src) {
			const hasSize = node.attrs.width && node.attrs.height;
			const hasFloat = node.attrs.float;
			state.write(
				formatter.openTag(
					node.attrs.diagramName.toLowerCase(),
					{
						path: node.attrs.src,
						title: node.attrs.title,
						...(hasSize ? { width: node.attrs.width, height: node.attrs.height } : {}),
						...(hasFloat ? { float: node.attrs.float } : {}),
					},
					true,
				),
			);
			state.closeBlock(node);
		} else {
			state.write(
				"```" + node.attrs.diagramName.toLowerCase() + (node.attrs.title ? `:${node.attrs.title}` : ``) + "\n",
			);
			state.text(node.attrs.content, false);
			state.ensureNewLine();
			state.write("```");
			state.closeBlock(node);
		}
	};

export default DiagramsFormatter;
