import { FormatterType } from "@ext/markdown/core/edit/logic/Formatter/Formatters/typeFormats/getFormatterType";
import { NodeSerializerSpec } from "@ext/markdown/core/edit/logic/Prosemirror/to_markdown";

const unsupportedFormatter =
	(formatter: FormatterType): NodeSerializerSpec =>
	(state, node) => {
		const formattedCode = node.attrs.code
			.split("\n")
			.map((line: string) => state.delim + line)
			.join("\n");

		state.write(
			`${formatter.openTag("unsupported", {
				source: node.attrs.source,
				url: node.attrs.url,
				type: node.attrs.type,
			})}\n\n`,
		);
		state.write("```JSON\n" + `${formattedCode}\n`);
		state.write("```\n\n");
		state.write(formatter.closeTag("unsupported"));
		state.closeBlock(node);
	};

export default unsupportedFormatter;
