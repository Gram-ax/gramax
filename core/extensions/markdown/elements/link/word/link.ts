import { ExternalHyperlink } from "docx";
import { WordInlineChild } from "../../../../wordExport/WordTypes";

export const linkWordLayout: WordInlineChild = async ({ state, tag, addOptions }) => {
	return [
		new ExternalHyperlink({
			children: await state.renderInline(tag, { ...addOptions, style: "Hyperlink" }),
			link: tag.attributes.href,
		}),
	];
};
