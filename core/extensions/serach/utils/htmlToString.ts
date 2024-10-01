import { htmlToText } from "html-to-text";

const htmlToString = (content: string): string => {
	try {
		return htmlToText(content, {
			tables: ["*"],
			selectors: [{ selector: "span.vc-comment-vars", format: "skip" }],
		});
	} catch (e) {
		console.error(e);
		return null;
	}
};

export default htmlToString;
