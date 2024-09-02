import ParserContext from "../../../Parser/ParserContext/ParserContext";
import { Schema } from "../Markdoc";

import { fence } from "@ext/markdown/elements/codeBlockLowlight/render/model/codeBlock";
import { article } from "../../../../elements/article/render/article";
import { code } from "../../../../elements/code/render/model/code";
import { em } from "../../../../elements/em/render/em";
import { heading } from "../../../../elements/heading/render/model/heading";
import { hr } from "../../../../elements/hr/render/hr";
import { image } from "../../../../elements/image/render/image";
import { link } from "../../../../elements/link/render/model/link";
import { li, ol, ul } from "../../../../elements/list/render/list";
import { paragraph } from "../../../../elements/paragraph/paragraph";
import { strikethrough } from "../../../../elements/strikethrough/render/strikethrough";
import { strong } from "../../../../elements/strong/render/strong";
import { sub } from "../../../../elements/sub/sub";
import { tbody, thead, tr } from "../../../../elements/table/render/model/table";

export default function getNodeElementRenderModels(context?: ParserContext): Record<string, Schema> {
	const contextelements = context ? getContextNodeElementRenderModels(context) : {};
	return {
		link: link(context),
		strikethrough,
		paragraph,
		article,
		heading,
		strong,
		fence,
		thead,
		tbody,
		code,
		sub,
		em,
		tr,
		hr,
		ul,
		ol,
		li,
		...contextelements,
	};
}

function getContextNodeElementRenderModels(context: ParserContext): Record<string, Schema> {
	return {
		image: image(context),
	};
}
