import type { LgtRule, LlmRule } from "../types";

export type StyleGuideRuleProvider = "lgt" | "llm";
export interface StyleGuideRule {
	readonly provider: StyleGuideRuleProvider;
	getName(): string;
	getModel(): LgtRule | LlmRule;
}

export class LgtRuleAdapter implements StyleGuideRule {
	public readonly provider = "lgt";
	constructor(private _model: LgtRule) {}

	getName(): string {
		return extractNameFromXml(this._model.xml);
	}

	getModel(): LgtRule {
		return this._model;
	}
}

export function extractNameFromXml(xml: string) {
	const nameRegex =
		/<(?:rule|rulegroup)(?:\s+[^>]*?)?(?:\s+name=["']([^"']*)["']|\s+id=["'][^"']*["']\s+name=["']([^"']*)["']|\s+name=["']([^"']*)["']\s+id=["'][^"']*["'])(?:\s+[^>]*?)?>/;
	const match = (xml ?? "").match(nameRegex);
	if (match) return match[1] || match[2] || match[3] || "";
	return "";
}

export function trimXmlNameName(xml: string): string {
	const name = extractNameFromXml(xml);
	const trimmedName = name.trim();
	return xml.replace(name, trimmedName);
}

export class LlmRuleAdapter implements StyleGuideRule {
	public readonly provider = "llm";
	constructor(private _model: LlmRule) {}

	getName(): string {
		return this._model.name;
	}

	getModel(): LlmRule {
		return this._model;
	}
}
