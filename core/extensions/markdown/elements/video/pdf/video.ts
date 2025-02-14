import { Tag } from "@ext/markdown/core/render/logic/Markdoc";
import { BASE_CONFIG, COLOR_CONFIG, FONT_SIZE_COEFFICIENT } from "@ext/pdfExport/config";
import { ContentStack } from "pdfmake/interfaces";

export function videoHandler(node: Tag): ContentStack {
	return {
		stack: [
			{
				text: "Video",
				link: node.attributes?.path || "",
				color: COLOR_CONFIG.video.linkColor,
				decoration: "underline",
				fontSize: BASE_CONFIG.FONT_SIZE * 0.75,
				margin: [0, 0, 0, BASE_CONFIG.FONT_SIZE * 0.5],
			},
			{
				text: node.attributes?.title || "",
				margin: [0, -BASE_CONFIG.FONT_SIZE * 0.25, 0, BASE_CONFIG.FONT_SIZE * 0.5],
				fontSize: BASE_CONFIG.FONT_SIZE * FONT_SIZE_COEFFICIENT,
				italics: true,
			},
		],
		alignment: "center",
	};
}
