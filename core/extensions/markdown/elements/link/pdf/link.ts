import { Tag } from "@ext/markdown/core/render/logic/Markdoc";
import { extractNameAndAnchor } from "@ext/markdown/elements/link/word/link";
import { COLOR_CONFIG } from "@ext/pdfExport/config";
import { pdfRenderContext } from "@ext/pdfExport/parseNodesPDF";
import { parseInlineContent } from "@ext/pdfExport/utils/parseInlineContent";
import { generateBookmarkName } from "@ext/wordExport/generateBookmarkName";
import { ContentText } from "pdfmake/interfaces";

export const linkHandler = async (node: Tag, context: pdfRenderContext): Promise<ContentText[]> => {
	const contentPromises = parseInlineContent(node);
	const isInternalLink = node.attributes.resourcePath !== "";

	let linkToDestination: string;
	const link = isInternalLink ? undefined : node.attributes?.href || "";

	if (isInternalLink) {
		const { title, order, anchor } = extractNameAndAnchor(
			node.attributes as { href: string; hash: string },
			context.titlesMap,
		);

		if (title !== undefined && order !== undefined) {
			linkToDestination = generateBookmarkName(order, title, anchor);
		}
	}

	const resolvedContent = await Promise.all(contentPromises);

	return resolvedContent.flat().map((item) => ({
		...item,
		...(linkToDestination ? { linkToDestination } : { link }),
		color: COLOR_CONFIG.link,
	}));
};
