import { editName } from "@ext/markdown/elements/blockContentField/consts";

function blockFieldToken() {
	return {
		block: editName,
		getAttrs: (tok) => {
			return {
				bind: tok.attrs?.bind,
				placeholder: tok.attrs?.placeholder,
			};
		},
	};
}

export default blockFieldToken;
