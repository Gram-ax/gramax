import { WordInlineChild } from "@ext/wordExport/options/WordTypes";
import { ICON_SIZE } from "@ext/wordExport/options/wordExportSettings";
import React from "react";
import ReactDOMServer from "react-dom/server";
import getLucideIcon from "../../../../../../components/Atoms/Icon/LucideIcon";
import { WordImageProcessor } from "@ext/markdown/elements/image/word/WordImageProcessor";

export const iconWordLayout: WordInlineChild = async ({ tag }) => {
	return [tag.attributes.svg ? await getHtmlIcon(tag.attributes.svg) : await getIconFromString(tag.attributes.code)];
};

export const getIconFromString = async (icon: string) => {
	let svgIcon = getLucideIcon(icon);
	if (!svgIcon) svgIcon = getLucideIcon("circle-help");
	return await getHtmlIcon(ReactDOMServer.renderToString(React.createElement(svgIcon)));
};

const getHtmlIcon = async (svgCode: string) => {
	return await WordImageProcessor.getImageFromSvgString(svgCode, ICON_SIZE);
};
