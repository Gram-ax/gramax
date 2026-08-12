export type RichTextSegment = { type: "text" | "code"; text: string };

const paragraphMarkup = /<p>(.*?)<\/p>/g;
const codeMarkup = /<code>(.*?)<\/code>/g;

export const parseRichText = (text: string): RichTextSegment[][] =>
	text
		.split(paragraphMarkup)
		.filter((paragraph) => paragraph.trim())
		.map((paragraph) =>
			paragraph
				.split(codeMarkup)
				.map((part, index): RichTextSegment => ({ type: index % 2 ? "code" : "text", text: part }))
				.filter((segment) => segment.text),
		);

export const stripMarkup = (text: string): string =>
	parseRichText(text)
		.map((segments) => segments.map((segment) => segment.text).join(""))
		.join(" ")
		.trim();
