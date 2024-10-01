import { MarkSerializerSpec } from "@ext/markdown/core/edit/logic/Prosemirror/to_markdown";

const getSuggestionFormatter = (): MarkSerializerSpec => {
	return {
		open: "",
		close: "",
	};
};
export default getSuggestionFormatter;
