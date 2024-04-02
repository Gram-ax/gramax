import { Paragraph, ParagraphChild } from "docx";

export function createParagraph(children: ParagraphChild[], style: string): Paragraph;
export function createParagraph(
	children: ParagraphChild[],
	spacing: { line: number; before: number; after: number },
): Paragraph;
export function createParagraph(
	children: ParagraphChild[],
	styleOrSpacing?: string | { line: number; before: number; after: number },
) {
	if (typeof styleOrSpacing === "string") return new Paragraph({ children, style: styleOrSpacing });
	return new Paragraph({ children, spacing: styleOrSpacing });
}
