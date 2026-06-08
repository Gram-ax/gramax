/** biome-ignore-all lint/suspicious/noExplicitAny: expected */
import type MarkdownIt from "markdown-it";

export const parseProperty = (token: any) => {
	const propertyMatches = token.content?.match(/\{%\s*#([^:]+):([^}]+)\s*%\}/g);
	if (!propertyMatches) return;

	const newToken = { ...token };
	const properties = propertyMatches.map((match) => {
		const [, name, value] = match.match(/\{%\s*#([^:]+):([^}]+)\s*%\}/);
		const values = value.split(",").map((v) => v.trim());
		return {
			name: name.trim(),
			value: values,
		};
	});

	let newContent = token.content;

	propertyMatches.forEach((match) => {
		newContent = newContent.replace(match, "");
	});

	newToken.content = newContent.trim();

	if (newToken.children) {
		newToken.children = newToken.children.map((child) => {
			const newChild = { ...child };

			if (typeof child.content === "string") {
				let childContent = child.content;
				propertyMatches.forEach((match) => {
					childContent = childContent.replace(match, "");
				});
				newChild.content = childContent.trim();
			}

			if (child.attrs) newChild.attrs = [...child.attrs, ["property", properties]];
			else newChild.attrs = [["property", properties]];

			return newChild;
		});
	}

	return newToken;
};

const processInlineProperties = (tokens: any[]) => {
	for (let i = 0; i < tokens.length; i++) {
		const token = tokens[i];
		const newToken = parseProperty(token);

		if (newToken) {
			tokens.splice(i, 1, newToken);
		}
	}
};

const isPropertyTag = (c: any) => c.type === "tag" && c.meta?.tag === "property";

export const extractInlinePropertyTokens = (tokens: any[]) => {
	for (let i = tokens.length - 1; i >= 0; i--) {
		const token = tokens[i];
		if (token.type !== "inline" || !token.children) continue;
		if (!token.children.some(isPropertyTag)) continue;

		const toExtract = token.children.filter((c: any) => isPropertyTag(c) || c.type === "tag_close");

		const remaining = token.children.filter((c: any) => !isPropertyTag(c) && c.type !== "tag_close");
		const hasContent = remaining.some((c: any) => c.content?.trim());

		if (hasContent) {
			token.children = remaining;
			token.content = remaining.map((c: any) => c.content ?? "").join("");
		} else {
			tokens.splice(i, 1);
			if (i > 0 && tokens[i - 1]?.type === "paragraph_open") {
				tokens.splice(i - 1, 1);
				i--;
			}
			if (i < tokens.length && tokens[i]?.type === "paragraph_close") {
				tokens.splice(i, 1);
			}
		}

		for (let k = toExtract.length - 1; k >= 0; k--) {
			toExtract[k].block = true;
			tokens.splice(i, 0, toExtract[k]);
		}
	}
};

export const processBlockProperties = (tokens: any[]) => {
	extractInlinePropertyTokens(tokens);

	for (let i = tokens.length - 1; i >= 0; i--) {
		const token = tokens[i];
		if (token.type !== "tag" || token.meta?.tag !== "property") continue;

		const id = token.meta.attributes?.find((a: any) => a.name === "id")?.value;
		const value = token.meta.attributes?.find((a: any) => a.name === "value")?.value;
		if (!id) continue;

		let tagOpenIdx = -1;
		let depth = 0;
		for (let j = i - 1; j >= 0; j--) {
			if (tokens[j].type === "tag_close") depth++;
			if (tokens[j].type === "tag_open") {
				depth--;
				if (depth === 0) {
					tagOpenIdx = j;
					break;
				}
			}
		}

		if (tagOpenIdx === -1) continue;

		const tagOpen = tokens[tagOpenIdx];
		if (!tagOpen.attrs) tagOpen.attrs = {};
		if (!tagOpen.attrs.property) tagOpen.attrs.property = [];

		const values = typeof value === "string" ? value.split(",").map((v: string) => v.trim()) : value;
		tagOpen.attrs.property.unshift({ id, value: values });

		if (!tagOpen.meta) tagOpen.meta = {};
		if (!tagOpen.meta.attributes) tagOpen.meta.attributes = [];
		const existingAttr = tagOpen.meta.attributes.find((a: any) => a.name === "property");
		if (existingAttr) {
			existingAttr.value = tagOpen.attrs.property;
		} else {
			tagOpen.meta.attributes.push({ type: "attribute", name: "property", value: tagOpen.attrs.property });
		}

		tokens.splice(i, 1);
	}
};

function propertiesPlugin(md: MarkdownIt) {
	md.core.ruler.push("properties", (state) => {
		processBlockProperties(state.tokens);
		processInlineProperties(state.tokens);
	});
}

export default propertiesPlugin;
