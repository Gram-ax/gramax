import strip from "remove-markdown";

const removeMarkdownUtils = {
	stripAll: (text: string): string => {
		return strip(text).replace(/\[[^[\]]*\]/gm, "");
	},
};

export default removeMarkdownUtils;
