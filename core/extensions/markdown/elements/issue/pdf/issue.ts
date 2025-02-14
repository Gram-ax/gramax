import { Tag } from "@ext/markdown/core/render/logic/Markdoc";
import getIssueLink from "@ext/markdown/elements/issue/logic/getIssueLink";
import { BASE_CONFIG, COLOR_CONFIG, FONT_SIZE_COEFFICIENT } from "@ext/pdfExport/config";
import { ContentText } from "pdfmake/interfaces";

export const issueHandler = (node: Tag): ContentText[] => {
	const issueText = node.attributes.id;
	const linkUrl = getIssueLink(issueText);

	return [
		{
			text: issueText,
			margin: [0, 2, 2, 0],
			fontSize: BASE_CONFIG.FONT_SIZE * FONT_SIZE_COEFFICIENT,
			color: COLOR_CONFIG.link,
			link: linkUrl,
			lineHeight: BASE_CONFIG.LINE_HEIGHT,
		},
	];
};
