import { ParseSpec } from "@ext/markdown/core/edit/logic/Prosemirror/from_markdown";

const tabsToken: ParseSpec = {
	block: "tabs",
	getAttrs(_, tokenStream, index) {
		let flag = false;
		let childIdx = 0;
		const childAttrs = tokenStream
			.map((tok, idx) => {
				if (index > idx) return;
				if (tok?.type == "tabs_close") flag = true;
				if (!tok || tok?.type !== "tab_open") return;
				if (flag) return;
				tok.attrs.idx = childIdx;
				childIdx++;
				return tok.attrs;
			})
			.filter((t) => t);

		return { childAttrs };
	},
};

export default tabsToken;
