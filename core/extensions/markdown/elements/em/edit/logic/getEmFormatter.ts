import { MarkSerializerSpec } from "@ext/markdown/core/edit/logic/Prosemirror/to_markdown";

const getEmFormatter = (): MarkSerializerSpec => {
	return { open: "*", close: "*", mixable: true, expelEnclosingWhitespace: true };
};
export default getEmFormatter;
