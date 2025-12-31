import { ParseSpec } from "@ext/markdown/core/edit/logic/Prosemirror/from_markdown";

const tabsToken: ParseSpec = {
	block: "tabs",
	getAttrs(_, tokenStream, index) {
		let flag = false;
		let childIdx = 0;
		let tabsDepth = 0;
		const childAttrs = tokenStream
			.map((tok, idx) => {
				if (index >= idx) return;
				if (flag) return;
				if (tok?.type == "tabs_close") {
					tabsDepth--;
					if (tabsDepth < 0) flag = true;
				}
				if (tok?.type == "tabs_open") {
					tabsDepth++;
				}
				if (!tok || tok?.type !== "tab_open") return;
				if (tabsDepth > 0) return;
				tok.attrs.idx = childIdx;
				childIdx++;
				return tok.attrs;
			})
			.filter((t) => t);

		return { childAttrs };
	},
};

export default tabsToken;
