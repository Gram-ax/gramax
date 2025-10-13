import docx from "@dynamicImports/docx";
import { WordInlineChild } from "../../../../wordExport/options/WordTypes";
import getIssueLink from "../logic/getIssueLink";
import { createContent } from "@ext/wordExport/TextWordGenerator";
import { WordFontStyles } from "@ext/wordExport/options/wordExportSettings";

export const issueWordLayout: WordInlineChild = async ({ tag, addOptions }) => {
	const { ExternalHyperlink } = await docx();
	return await Promise.resolve([
		new ExternalHyperlink({
			children: [await createContent(tag.attributes.id, { ...addOptions, style: WordFontStyles.issue })],
			link: getIssueLink(tag.attributes.id),
		}),
	]);
};
