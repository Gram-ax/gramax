import { NodeSerializerSpec } from "@ext/markdown/core/edit/logic/Prosemirror/to_markdown";
import OPEN_API_NAME from "@ext/markdown/elements/openApi/name";

const OpenApiFormatter: NodeSerializerSpec = (state, node) => {
	state.write(
		`[${OPEN_API_NAME}:${node.attrs.src ?? ""}${
			typeof node.attrs.flag === "boolean" ? `:${node.attrs.flag}` : ``
		}]`,
	);
	state.closeBlock(node);
};

export default OpenApiFormatter;
