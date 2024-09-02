import { WordExportHelper } from "@ext/wordExport/WordExportHelpers";
import { WordInlineChild } from "@ext/wordExport/options/WordTypes";
import { ICON_SIZE } from "@ext/wordExport/options/wordExportSettings";
import React from "react";
import ReactDOMServer from "react-dom/server";
import getLucideIcon from "../../../../../../components/Atoms/Icon/LucideIcon";

export const iconWordLayout: WordInlineChild = async ({ tag }) => {
	return [await getIconFromString(tag.attributes.code)];
};

export const getIconFromString = async (icon: string) => {
	let svgIcon = getLucideIcon(icon);
	if (!svgIcon) svgIcon = getLucideIcon("circle-help");
	return await WordExportHelper.getImageFromSvgString(
		ReactDOMServer.renderToString(React.createElement(svgIcon)),
		ICON_SIZE,
	);
};
