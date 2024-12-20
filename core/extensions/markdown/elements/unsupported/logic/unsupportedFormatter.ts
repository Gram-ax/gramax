import { NodeSerializerSpec } from "@ext/markdown/core/edit/logic/Prosemirror/to_markdown";

const unsupportedFormatter: NodeSerializerSpec = (state, node) => {
	const formattedCode = node.attrs.code
		.split("\n")
		.map((line: string) => state.delim + line)
		.join("\n");

	state.write(
		`[unsupported:${node.attrs.source}:${node.attrs.url ?? ""}${node.attrs.type ? `:${node.attrs.type}` : ""}]\n\n`,
	);
	state.write("```JSON\n" + `${formattedCode}\n`);
	state.write("```\n\n");
	state.write(`[/unsupported]`);
	state.closeBlock(node);
};

export default unsupportedFormatter;
