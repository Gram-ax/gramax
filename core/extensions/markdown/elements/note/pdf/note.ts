import { ContentTable, Content } from "pdfmake/interfaces";
import { parseNodeToPDFContent } from "@ext/pdfExport/parseNodesPDF";
import { getSvgIconFromString } from "@ext/pdfExport/utils/getIcon";
import { noteIcons } from "@ext/markdown/elements/note/render/component/Note";
import { BASE_CONFIG, NOTE_COLOR_CONFIG } from "@ext/pdfExport/config";
import { Tag } from "@ext/markdown/core/render/logic/Markdoc";

export async function noteHandler(node: Tag, level = 0, parseContent = parseNodeToPDFContent): Promise<ContentTable> {
	const noteType = node.attributes?.type || "note";
	const borderColor = NOTE_COLOR_CONFIG.borderColors[noteType] || NOTE_COLOR_CONFIG.borderColors.quote;
	const bgColor = NOTE_COLOR_CONFIG.bgColors[noteType] || "";
	const svg = getSvgIconFromString(noteIcons[noteType], borderColor);

	const parsedContent = await parseContent(node, level);

	const flattenContent = (content: Content | Content[]): Content[] =>
		Array.isArray(content)
			? content.flatMap((item) => (Array.isArray(item) ? flattenContent(item) : item))
			: [content];

	const contentArray: Content[] = flattenContent(parsedContent);

	let titleOrContent: Content | Content[];

	if (node.attributes?.title && typeof node.attributes.title === "string") {
		titleOrContent = {
			text: node.attributes.title,
			fontSize: BASE_CONFIG.FONT_SIZE * 0.75,
			bold: true,
			color: borderColor,
		};
	} else if (Array.isArray(contentArray) && typeof contentArray[0] === "object") {
		titleOrContent = contentArray[0];
	} else {
		titleOrContent = { text: "", fontSize: BASE_CONFIG.FONT_SIZE };
	}

	return {
		table: {
			dontBreakRows: true,
			widths: ["*"],
			body: [
				[
					{
						margin: [
							BASE_CONFIG.FONT_SIZE * 0.75,
							BASE_CONFIG.FONT_SIZE * 0.75,
							BASE_CONFIG.FONT_SIZE * 0.75,
							BASE_CONFIG.FONT_SIZE * 0.75 - BASE_CONFIG.LINE_HEIGHT_MARGIN,
						],
						fillColor: bgColor,
						stack: [
							{
								columns: [
									{
										svg: svg,
										width: BASE_CONFIG.FONT_SIZE * 0.875,
										height: BASE_CONFIG.FONT_SIZE * 0.875,
									},
									{
										...titleOrContent,
										margin: node.attributes?.title
											? [BASE_CONFIG.FONT_SIZE * 0.5, 0, 0, BASE_CONFIG.FONT_SIZE * 0.75]
											: [BASE_CONFIG.FONT_SIZE * 0.5, 0, 0, 0],
									},
								],
							},
							...(!node.attributes?.title ? contentArray.slice(1) : contentArray),
						],
						border: [true, true, true, false],
						borderColor: [borderColor, bgColor, bgColor, false],
					},
				],
			],
		},
	};
}
