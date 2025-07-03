import { transformAllTables } from "./replacerUtils";

const noteTypes = {
	info: "info",
	tip: "lab",
	warning: "note",
	alert: "danger",
	default: "quote",
};

class Replacer {
	private readonly _coloredTextRegExp = /\{(\w+)\}\((.*?)\)/g;
	private readonly _underlineTextRegExp = /\+\+(.*?)\+\+/g;
	private readonly _monoTextRegExp = /##(?=\S)([^\n]*?\S)##/g;
	private readonly _highlightTextRegExp = /==(.*?)==/g;
	private readonly _anchorTextRegExp = /#\[([^\]]+)\]\(([^\s)]+)(?:\s+"[^"]*")?\)/g;
	private readonly _angleLinkRegex = /<([^>\s]+)>/g;

	private readonly _noteBlockRegExp = /{%\s*note\s*(\w+)(?:\s*"([^"]*)")?\s*%}([\s\S]*?){%\s*endnote\s*%}/g;
	private readonly _cutBlockRegExp = /^([ \t]*){%\s*cut\s*"([^"]*)"\s*%}([\s\S]*?)^[ \t]*{%\s*endcut\s*%}/gm;
	private readonly _iframeBlockRegExp =
		/\/iframe\/\(src="([^"]+)"\s+width="(\d+)"\s+height="(\d+)"(?:\s+scrolling="[^"]*")?\)/g;

	private readonly _checkboxItemRegExp = /^(\s*)(?:(\d+\.)\s*)?\[([Xx ])\]\s+(.*)$/gm;
	private readonly _headingAnchorRegex = /^(#+\s.*?)(\s*\{#[^}]+\})$/gm;

	private readonly _img = /!\[[^\]]*]\([^)\n]+\)(?:\{[^}\n]*\})?/g;
	constructor() {}

	replaceInlineMark(sourceText: string) {
		let text = sourceText;

		text = text.replace(/^###### (.*)$/gm, "#### $1"); // h6 to h4
		text = text.replace(/^##### (.*)$/gm, "#### $1"); // h5 to h4
		text = text.replace(/^# (.*)$/gm, "## $1"); // h1 to h2
		text = text.replace(this._coloredTextRegExp, "[color:$1]$2[/color]");
		text = text.replace(this._underlineTextRegExp, "**$1**");
		text = text.replace(this._monoTextRegExp, (match, content) => "`" + content + "`");
		text = text.replace(this._highlightTextRegExp, "[color:yellow]$1[/color]");
		text = text.replace(this._anchorTextRegExp, "[$1](#$2)");
		text = text.replace(this._headingAnchorRegex, (match, headingText) => headingText);
		text = text.replace(this._angleLinkRegex, (match, url) => `[${url}](${url})`);

		return text;
	}

	replaceIframe(sourceText: string) {
		let text = sourceText;

		text = text.replace(this._iframeBlockRegExp, (match, src, width, height) => {
			return `[html:iframe]\n\n<iframe width="${width}" height="${height}" src="${src}"></iframe>\n\n[/html]`;
		});

		return text;
	}

	replaceNotes(sourceText: string) {
		let text = sourceText;

		while (this._noteBlockRegExp.test(text)) {
			text = text.replace(this._noteBlockRegExp, (match, type, title, content) => {
				const newType = (noteTypes as any)[type] || "quote";
				const formattedTitle = title ? ` ${title}` : "";
				let formattedContent = content;
				if (formattedContent.length > 5) {
					if (formattedContent.startsWith("\n\n")) formattedContent = formattedContent.slice(2);
					if (
						formattedContent[formattedContent.length - 1] === "\n" &&
						formattedContent[formattedContent.length - 2]
					) {
						formattedContent = formattedContent.slice(0, -2);
					}
				}

				return `:::${newType}${formattedTitle}\n\n${formattedContent}\n\n:::`;
			});
		}

		return text;
	}

	relocateInlineImages(src: string): string {
		return src.replace(/^([ \t]*)([^\n]*)$/gm, (_m, indent: string, line: string) => {
			if (!this._img.test(line)) {
				this._img.lastIndex = 0;
				return indent + line;
			}

			const images = line.match(this._img)!;
			const parts = line.split(this._img);
			const blocks: string[] = [];

			const preRaw = parts[0];
			const preTrim = preRaw.trim();

			const bulletOnly = /^[*+\\-]$|^\d+\.$/.test(preTrim);

			if (bulletOnly) {
				const bulletIndent = indent + preRaw;
				const contIndent = indent + " ".repeat(preRaw.length);

				blocks.push(bulletIndent + images[0]);

				const tail = parts[1];
				if (tail && tail.trim()) blocks.push(contIndent + tail.trimStart());

				for (let i = 1; i < images.length; i++) {
					blocks.push(contIndent + images[i]);

					const after = parts[i + 1];
					if (after && after.trim()) blocks.push(contIndent + after.trimStart());
				}
			} else {
				if (preTrim) blocks.push(indent + preTrim);

				images.forEach((img, i) => {
					blocks.push(indent + img);

					const tail = parts[i + 1];
					if (tail && tail.trim()) blocks.push(indent + tail.trimStart());
				});
			}

			return blocks.join("\n\n");
		});
	}

	replaceCheckBox(sourceText: string) {
		let text = sourceText;

		text = text.replace(this._checkboxItemRegExp, (match, indent, numPrefix, mark, content) => {
			let prefix = numPrefix ? numPrefix + " * [ ] " : "* [ ] ";
			return indent + prefix + content;
		});

		return text;
	}

	replaceTabs(sourceText: string) {
		let text = sourceText;
		// eslint-disable-next-line
		text = text.replace(/\{\%\s*list\s+tabs\s*\%\}/g, "[tabs]");
		// eslint-disable-next-line
		text = text.replace(/\{\%\s*endlist\s*\%\}/g, "[/tabs]");

		const tabBlockRegex = /^-\s+(.*)(\r?\n(?:(?!^-\s+|\[\/tabs\]).*\r?\n?)*)/gm;

		text = text.replace(tabBlockRegex, (match, title, body) => {
			return `[tab:${title}::]${body}[/tab]\n`;
		});

		return text;
	}

	transformTable(sourceText: string): string {
		return transformAllTables(sourceText);
	}

	replaceCuts(src: string): string {
		return src.replace(this._cutBlockRegExp, (_m, indent: string, title: string, body: string) => {
			const trimmed = body.replace(/^\s*\n|\n\s*$/g, "");

			const indentedBody = trimmed
				.split("\n")
				.map((line) => indent + line)
				.join("\n");

			return `${indent}:::quote ${title}\n\n` + (indentedBody ? indentedBody + "\n\n" : "") + `${indent}:::`;
		});
	}

	postReplace(sourceText: string) {
		let content = sourceText;

		content = content.replace(/{%\s*endblock\s*%}/g, "");
		content = content.replace(/{%\s*endlayout\s*%}/g, "");

		return content;
	}

	applyReplacers(content: string): string {
		content = this.replaceInlineMark(content);
		content = this.replaceNotes(content);
		content = this.replaceCuts(content);
		content = this.replaceIframe(content);
		content = this.replaceCheckBox(content);
		content = this.replaceTabs(content);
		content = this.transformTable(content);
		content = this.relocateInlineImages(content);
		content = this.postReplace(content);

		return content;
	}
}

export default new Replacer();
