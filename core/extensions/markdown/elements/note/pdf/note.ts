import { Tag } from "@ext/markdown/core/render/logic/Markdoc";
import { BASE_CONFIG, NOTE_COLOR_CONFIG } from "@ext/pdfExport/config";
import { parseNodeToPDFContent, pdfRenderContext, NodeOptions } from "@ext/pdfExport/parseNodesPDF";
import { noteIcons } from "@ext/markdown/elements/note/render/component/Note";
import { getSvgIconFromString } from "@ext/pdfExport/utils/getIcon";
import { ContentTable, Content, TableCell } from "pdfmake/interfaces";
import { JSONContent } from "@tiptap/core";

const OUTER = BASE_CONFIG.FONT_SIZE * 0.75;
const INNER = OUTER;

export async function noteHandler(
	node: Tag | JSONContent,
	context: pdfRenderContext,
	options: NodeOptions,
): Promise<ContentTable> {
	const attrs = "attributes" in node ? node.attributes : node.attrs;
	const noteType = attrs?.type || "note";
	const borderColor = NOTE_COLOR_CONFIG.borderColors[noteType] || NOTE_COLOR_CONFIG.borderColors.quote;
	const bgColor = NOTE_COLOR_CONFIG.bgColors[noteType] || "";
	const svg = await getSvgIconFromString(noteIcons[noteType], borderColor);

	const parsedContent = await parseNodeToPDFContent(node, context, options);

	const flatten = (c: Content | Content[]): Content[] => (Array.isArray(c) ? c.flatMap(flatten) : [c]);

	const contentArray = flatten(parsedContent);

	const titleContent =
		attrs?.title && typeof attrs.title === "string"
			? {
					text: attrs.title,
					fontSize: BASE_CONFIG.FONT_SIZE * 0.75,
					bold: true,
					color: borderColor,
			  }
			: typeof contentArray[0] === "object"
			? contentArray[0]
			: { text: "", fontSize: BASE_CONFIG.FONT_SIZE };

	const rows: TableCell[][] = [];

	rows.push([
		{
			columns: [
				{ svg: svg, width: BASE_CONFIG.FONT_SIZE * 0.875, height: BASE_CONFIG.FONT_SIZE * 0.875 },
				{ ...titleContent, margin: [BASE_CONFIG.FONT_SIZE * 0.5, 0, 0, 0] },
			],
		},
	]);

	const noteContent = attrs?.title ? contentArray : contentArray.slice(1);
	noteContent.forEach((c) => {
		if (typeof c === "object") {
			rows.push([{ ...c }]);
		} else {
			rows.push([{ text: c, fontSize: BASE_CONFIG.FONT_SIZE }]);
		}
	});

	const noteLayout = {
		vLineWidth: (i: number) => (i === 0 ? 2 : 0),
		vLineColor: () => borderColor,

		hLineWidth: () => 0,
		hLineColor: () => borderColor,

		fillColor: () => bgColor,

		paddingLeft: () => INNER,
		paddingRight: () => INNER,
		paddingTop: (rowIdx: number) => (rowIdx === 0 ? INNER : 0),
		paddingBottom: (rowIdx: number, node: any) =>
			rowIdx === node.table.body.length - 1 ? INNER - BASE_CONFIG.LINE_HEIGHT_MARGIN : 0,
	} as const;

	return {
		table: {
			widths: ["*"],
			body: rows,
		},

		layout: noteLayout,
	};
}
