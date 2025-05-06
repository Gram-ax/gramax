import { MarkSerializerSpec } from "@ext/markdown/core/edit/logic/Prosemirror/to_markdown";

const getStrongFormatter = (): MarkSerializerSpec => {
	return { open: "**", close: "**", mixable: true, expelEnclosingWhitespace: true };
};
export default getStrongFormatter;
