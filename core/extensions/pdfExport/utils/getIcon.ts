import { LucideIcon } from "@components/Atoms/Icon/LucideIcon";
import { COLOR_CONFIG } from "@ext/pdfExport/config";
import React from "react";
import ReactDOMServer from "react-dom/server";

export const getSvgIconFromString = async (
	iconName: string,
	color: string = COLOR_CONFIG.black,
	strokeWidth: string = "2",
) => {
	let svgIcon = await LucideIcon(iconName);
	if (!svgIcon) svgIcon = await LucideIcon("circle-help");

	const svgString = ReactDOMServer.renderToStaticMarkup(React.createElement(svgIcon));

	const cleanedSvgString = svgString
		.replace(/ class="[^"]*"/g, "")
		.replace(/ stroke="currentColor"/g, ` stroke="${color}"`)
		.replace(/ stroke-width="[^"]*"/g, ` stroke-width="${strokeWidth}"`);

	return cleanedSvgString;
};
