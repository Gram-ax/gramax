import htmlToText from "@dynamicImports/htmlToText";

const htmlToString = async (content: string): Promise<string> => {
	try {
		const { htmlToText: htmlToTextFn } = await htmlToText();
		return htmlToTextFn(content, {
			tables: ["*"],
			selectors: [{ selector: "span.vc-comment-vars", format: "skip" }],
		});
	} catch (e) {
		console.error(e);
		return null;
	}
};

export default htmlToString;
