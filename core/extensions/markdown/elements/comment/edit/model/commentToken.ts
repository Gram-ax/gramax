import { ParseSpec } from "../../../../core/edit/logic/Prosemirror/from_markdown";

function commentToken(): ParseSpec {
	return {
		mark: "comment",
		getAttrs: (tok) => {
			if (!tok.attrs.id) return null;
			return { ...tok.attrs };
		},
	};
}

export default commentToken;
