import docx from "@dynamicImports/docx";
import type { WordBlockChild, WordInlineChild } from "@ext/wordExport/options/WordTypes";
import { WordFontStyles } from "@ext/wordExport/options/wordExportSettings";
import { buildInlineMathRun } from "./logic/buildInlineMathRun";
import { latexToOmmlComponent } from "./logic/latexToOmml";
import { normalizeLatex } from "./logic/normalizeLatex";

export const formulaWordBlockLayout: WordBlockChild = async ({ tag }) => {
	const { Paragraph, TextRun } = await docx();
	const latexRaw = tag?.attributes?.latex ?? tag?.attributes?.content;
	const { latex, display } = normalizeLatex(latexRaw);

	try {
		const result = await latexToOmmlComponent(latex, display);
		if (result?.component) return [new Paragraph({ style: WordFontStyles.formula, children: [result.component] })];
	} catch {
		// ignore and fall back to text
	}

	return [new Paragraph({ style: WordFontStyles.formula, children: [new TextRun(latexRaw ?? "")] })];
};

export const formulaWordInlineLayout: WordInlineChild = async ({ tag }) => {
	const { TextRun, ImportedXmlComponent } = await docx();
	const latexRaw = tag?.attributes?.latex ?? tag?.attributes?.content;
	const { latex } = normalizeLatex(latexRaw);

	try {
		const result = await latexToOmmlComponent(latex, false);
		if (result?.component) {
			const run = buildInlineMathRun(result.component, WordFontStyles.formulaInline, ImportedXmlComponent);
			if (run) return [run];
		}
	} catch {
		// ignore and fall back to text
	}

	return [new TextRun({ text: latexRaw ?? "", style: WordFontStyles.formulaInline })];
};
