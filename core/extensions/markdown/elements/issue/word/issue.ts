import docx from "@dynamicImports/docx";
import { WordFontStyles } from "@ext/wordExport/options/wordExportSettings";
import { createContent } from "@ext/wordExport/TextWordGenerator";
import type { WordInlineChild } from "../../../../wordExport/options/WordTypes";
import getIssueLink from "../logic/getIssueLink";

export const issueWordLayout: WordInlineChild = async ({ tag, addOptions }) => {
	const { ExternalHyperlink } = await docx();
	return await Promise.resolve([
		new ExternalHyperlink({
			children: [await createContent(tag.attributes.id, { ...addOptions, style: WordFontStyles.issue })],
			link: getIssueLink(tag.attributes.id),
		}),
	]);
};
