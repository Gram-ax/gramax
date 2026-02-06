import docx from "@dynamicImports/docx";
import type { ParagraphChild } from "docx";

export async function createParagraph(children: ParagraphChild[], style?: string) {
	const { Paragraph } = await docx();
	return new Paragraph({ children, style });
}
