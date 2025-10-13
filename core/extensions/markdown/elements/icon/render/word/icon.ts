import { WordInlineChild } from "@ext/wordExport/options/WordTypes";
import { ICON_SIZE } from "@ext/wordExport/options/wordExportSettings";
import React from "react";
import ReactDOMServer from "react-dom/server";
import { LucideIcon } from "../../../../../../components/Atoms/Icon/LucideIcon";
import { WordImageExporter } from "@ext/markdown/elements/image/word/WordImageProcessor";

export const iconWordLayout: WordInlineChild = async ({ tag }) => {
	const attrs = "attributes" in tag ? tag.attributes : tag.attrs;
	return [attrs.svg ? await getHtmlIcon(attrs.svg) : await getIconFromString(attrs.code)];
};

export const getIconFromString = async (icon: string) => {
	let svgIcon = await LucideIcon(icon);
	if (!svgIcon) svgIcon = await LucideIcon("circle-help");
	return await getHtmlIcon(ReactDOMServer.renderToString(React.createElement(svgIcon)));
};

const getHtmlIcon = async (svgCode: string) => {
	return await WordImageExporter.getImageFromSvgString(svgCode, ICON_SIZE);
};
