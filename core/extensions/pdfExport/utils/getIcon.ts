import LucideIcon from "@components/Atoms/Icon/LucideIcon";
import { COLOR_CONFIG } from "@ext/pdfExport/config";
import React from "react";
import ReactDOMServer from "react-dom/server";

export const getSvgIconFromString = (iconName: string, color: string = COLOR_CONFIG.black) => {
	let svgIcon = LucideIcon(iconName);
	if (!svgIcon) svgIcon = LucideIcon("circle-help");

	const svgString = ReactDOMServer.renderToStaticMarkup(React.createElement(svgIcon));

	const cleanedSvgString = svgString
		.replace(/ class="[^"]*"/g, "")
		.replace(/ stroke="currentColor"/g, ` stroke="${color}"`);

	return cleanedSvgString;
};
