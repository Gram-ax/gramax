import { Schema } from "../../render/logic/Markdoc/index";

export interface MdParserOptions {
	tags: { [name: string]: Schema };
}

export default class MdParser {
	private _tags: { [name: string]: Schema };
	private _escapeDoubleQuotesRegExp: RegExp;
	private _removeCommentsRegExp: RegExp;
	private _includeRegExp: RegExp;
	private _formulaRegExp: RegExp;
	private _squareRegExp: RegExp;
	private _arrowRegExp: RegExp;
	private _dashRegExp: RegExp;
	private _idRegExp: RegExp;
	private _brRegExp: RegExp;
	private _emptyParagraphRegExp: RegExp;
	private _findHtmlRegExp: RegExp;
	private _findHtmlTagRegExp: RegExp;

	private _backDashRegExp: RegExp;
	private _backArrowRegExp: RegExp;

	private _listWithAnEmptyItem: RegExp;
	private _table: RegExp;
	private _emptyTableCell: RegExp;

	private _findInlineCodeToIgnore = "`{1,2}[^`].*?`{1,2}";
	private _findBlockCodeToIgnore = "```[^(```)]*?```[^(```)]*?```\n\r?```|```[\\s\\S]*?```[s]?|\\\\.";
	private _findHtmlToIgnore = "\\[html.*][\\s\\S]*?\\[\\/html\\]";

	private _preTagRegExp: RegExp;

	constructor(preParserOptions: MdParserOptions = null) {
		this._tags = preParserOptions?.tags ?? {};
		this._escapeDoubleQuotesRegExp = this._createIgnoreRegExp(String.raw`.*?[^\\](").*?`);
		this._emptyParagraphRegExp = this._createIgnoreRegExp(String.raw`(\r?\n{4,})`);
		this._removeCommentsRegExp = this._createIgnoreRegExp(String.raw`(<!--[\s\S]*?-->)`);
		this._includeRegExp = this._createIgnoreRegExp(String.raw`^ *(#*) *\[include:([^\n\]]*)\]`);
		this._formulaRegExp = this._createIgnoreRegExp(
			String.raw`{\s?.*?\s?}|(\${1}[^\$].*?\${1})|(\${2}[^\$].*?\${2})`,
		);
		this._squareRegExp = this._createIgnoreRegExp(String.raw`\[(.*?)\](\()?`);
		this._arrowRegExp = this._createIgnoreRegExp(String.raw`\\-->|[^\\\r\n]?(-->)`);
		this._dashRegExp = this._createIgnoreRegExp(String.raw`.?-->.?|\\--|.?--[-]+|[^\\\n\r]?(--)`);
		this._idRegExp = this._createIgnoreRegExp(String.raw`[[{] ?(#.*?) ?[\]}]`);
		this._brRegExp = this._createIgnoreRegExp(String.raw`(<br>|<br\/>)`);
		this._backDashRegExp = this._createIgnoreRegExp(String.raw`(—)`);
		this._backArrowRegExp = this._createIgnoreRegExp(String.raw`(→)`);
		this._listWithAnEmptyItem = new RegExp(String.raw`^[ \t]*(?:\d+\.|-)[ \t]*$`, "gm");
		this._table = new RegExp(String.raw`{% table\s*([^%]*)%}([\s\S]*?){% \/table %}`, "gm");
		this._emptyTableCell = new RegExp(String.raw`^(?:\*)[ \t]*$`, "gm");

		this._findHtmlRegExp = new RegExp(String.raw`(^[^\n]*)\[html.*]([\s\S]*?)\[\/html\]`, "gm");
		this._findHtmlTagRegExp = new RegExp(String.raw`(^[^\n]*)(<html[^>]*>)([\s\S]*?)<\/html>`, "gm");
		this._preTagRegExp = new RegExp(String.raw`<pre>([\s\S]*?)<\/pre>`, "gm");
	}

	use(tag: Schema) {
		this._tags[tag.render.toLowerCase()] = tag;
	}

	preParse(content: string): string {
		content = this._preTagParser(content);
		content = this._removeComments(content);
		content = this._tableParser(content);
		content = this._includeParse(content);
		content = this._idParser(content);
		content = this._dashArrowParser(content);
		content = this._squareBracketsParser(content);
		content = this._formulaParser(content);
		content = this._brParser(content);
		content = this._emptyParagraphParser(content);
		content = this._htmlParser(content);
		return content;
	}

	backParse(content: string): string {
		content = this._backdashArrowParser(content);
		content = this._listParser(content);
		return content;
	}

	private _tableParser(content: string) {
		return content.replaceAll(this._table, (table: string) => {
			return table.replaceAll(this._emptyTableCell, (cell: string) => {
				return cell + "\u00A0";
			});
		});
	}

	private _listParser(content: string): string {
		return content.replaceAll(this._listWithAnEmptyItem, (listItem: string) => {
			return listItem + "\u00A0";
		});
	}

	private _emptyParagraphParser(content: string): string {
		content = "\n\n" + content;
		content = content.replaceAll(this._emptyParagraphRegExp, (str: string, match: string) => {
			if (!match) return str;
			const emptyParagraphsCounter = (match.split("\n").length - 2) / 2;
			const res: string[] = [];
			for (let i = 1; i <= emptyParagraphsCounter; i++) res.push("\n\n&nbsp;");
			return str.replace(match, res.join("") + "\n\n");
		});
		return content.replace(/^\n\n/, "");
	}

	private _escapeDoubleQuotes(content: string): string {
		return content.replaceAll(this._escapeDoubleQuotesRegExp, (str: string, match: string) =>
			str.replace(match, `\\"`),
		);
	}

	private _backdashArrowParser(content: string): string {
		return content
			.replaceAll(this._backArrowRegExp, (str: string, match: string) => str.replace(match, "-->"))
			.replaceAll(this._backDashRegExp, (str: string, match: string) => str.replace(match, "--"));
	}

	private _includeParse(content: string): string {
		return content.replaceAll(this._includeRegExp, (str: string, group: string, group2: string) => {
			if (!group || !group2) return str;
			const tag = this._tags["include"];
			return tag ? this._parse([null, group2, group], tag) : str;
		});
	}
	private _dashArrowParser(content: string): string {
		return content
			.replaceAll(this._arrowRegExp, (str: string, match: string) => str.replace(match, "→"))
			.replaceAll(this._dashRegExp, (str: string, match: string) => str.replace(match, "—"));
	}

	private _brParser(content: string): string {
		return content.replaceAll(this._brRegExp, (str: string, match: string) =>
			match ? this._parse(["br"], this._tags.br) : str,
		);
	}

	private _squareBracketsParser(content: string): string {
		return content.replaceAll(this._squareRegExp, (str: string, group: string, hasOpenBracket: string) => {
			if (!group || hasOpenBracket) return str;
			group = this._screenLink(group);
			const split = group.split(":");
			if (split[0][0] === "/") {
				const tagName = split[0].slice(1).toLowerCase();
				const tag = this._tags[tagName];
				if (tag?.selfClosing === false) return this._parseClose(tagName);
			}
			const tag = this._tags[split[0].toLowerCase()];
			return tag ? this._parse(split, tag) : str;
		});
	}

	private _idParser(content: string): string {
		return content.replaceAll(this._idRegExp, (str: string, match: string) => {
			if (!match) return str;
			if (match[1] == ":") match = match.replace(/:/, "");
			return `{% ${match} %}`;
		});
	}

	private _formulaParser(content: string): string {
		return content.replaceAll(this._formulaRegExp, (str: string, firstGroup: string, secondGroup: string) => {
			const group = firstGroup || secondGroup;
			if (!group) return str;
			const tag = this._tags.formula;
			return this._parse([tag.render, group.replaceAll("\\", "\\\\")], tag);
		});
	}

	private _htmlParser(content: string): string {
		content = content.replaceAll(this._findHtmlRegExp, (_: string, firstGroup: string, secondGroup: string) => {
			const group = secondGroup;
			if (!group) return `{%html %}${secondGroup}{%/html%}`;
			const space = " ".repeat(firstGroup.length);
			return `${firstGroup}{%html mode="${
				/\[html:(.*?)\]/.exec(_)?.[1] || "iframe"
			}" %}\n${space}\`\`\`\n${secondGroup}\n${space}\`\`\`\n${space}{%/html%}`;
		});

		content = content.replaceAll(
			this._findHtmlTagRegExp,
			(_: string, firstGroup: string, htmlTag: string, secondGroup: string) => {
				const group = secondGroup;
				if (!group) return `${htmlTag}${secondGroup}</html>`;
				const space = " ".repeat(firstGroup.length);
				return `${firstGroup}${htmlTag}\n${space}\`\`\`\n${secondGroup}\n${space}\`\`\`\n${space}</html>`;
			},
		);

		return content;
	}

	private _parse(split: string[], tag: Schema): string {
		let props = [];
		if (tag?.attributes) {
			const attributes = Object.keys(tag.attributes);
			props = split
				.slice(1)
				.map((value, index) => `${attributes[index]}="${this._unScreenLink(this._escapeDoubleQuotes(value))}"`);
		}
		return `{%${tag.render.toLowerCase()} ${props.join(" ")} ${tag.selfClosing === false ? "" : "/"}%}`;
	}

	private _parseClose(tagName: string): string {
		return `{%/${tagName.toLowerCase()}%}`;
	}

	private _screenLink(content: string): string {
		return content.replaceAll(`://`, `|//`);
	}

	private _unScreenLink(content: string): string {
		return content.replaceAll(`|//`, `://`);
	}

	private _createIgnoreRegExp(reg: string, ...additionalIgnore: string[]): RegExp {
		const commonString = [
			this._findInlineCodeToIgnore,
			this._findBlockCodeToIgnore,
			this._findHtmlToIgnore,
			...additionalIgnore,
			reg,
		].join("|");

		return new RegExp(commonString, "gm");
	}

	private _removeComments(content: string): string {
		return content.replaceAll(this._removeCommentsRegExp, (str: string, comment: string) =>
			str.replace(comment, ""),
		);
	}

	private _preTagParser(content: string): string {
		return content.replaceAll(this._preTagRegExp, (str: string, preContent: string) => {
			if (!preContent.includes("\n")) preContent = "\n" + preContent + "\n";

			return `\`\`\`${preContent}\`\`\``;
		});
	}
}
