import { ExternalHyperlink, TextRun } from "docx";
import { WordInlineChild } from "../../../../wordExport/WordTypes";
import getIssueLink from "../logic/getIssueLink";

export const issueWordLayout: WordInlineChild = async ({ tag }) => {
	return await Promise.resolve([
		new ExternalHyperlink({
			children: [new TextRun({ text: tag.attributes.id, style: "Hyperlink" })],
			link: getIssueLink(tag.attributes.id),
		}),
	]);
};
