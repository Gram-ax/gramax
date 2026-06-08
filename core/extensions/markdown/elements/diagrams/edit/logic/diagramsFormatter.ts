import type { FormatterType } from "@ext/markdown/core/edit/logic/Formatter/Formatters/typeFormats/getFormatterType";
import type { NodeSerializerSpec } from "../../../../core/edit/logic/Prosemirror/to_markdown";

const DiagramsFormatter =
	(formatter: FormatterType): NodeSerializerSpec =>
	(state, node) => {
		if (node.attrs.src) {
			const hasSize = node.attrs.width && node.attrs.height;
			const hasFloat = node.attrs.float;
			const hasScale = node.attrs.scale;
			state.write(
				formatter.openTag(
					node.attrs.diagramName.toLowerCase(),
					{
						path: node.attrs.src,
						title: node.attrs.title,
						...(hasSize ? { width: node.attrs.width, height: node.attrs.height } : {}),
						...(hasFloat || hasScale ? { float: node.attrs.float ?? "" } : {}),
						...(hasScale ? { scale: node.attrs.scale } : {}),
					},
					true,
				),
			);
			state.closeBlock(node);
		} else {
			state.write(
				`\`\`\`${node.attrs.diagramName.toLowerCase()}${node.attrs.title ? `:${node.attrs.title}` : ``}\n`,
			);
			state.text(node.attrs.content, false);
			state.ensureNewLine();
			state.write("```");
			state.closeBlock(node);
		}
	};

export default DiagramsFormatter;
