import t from "@ext/localization/locale/translate";
import { z } from "zod";
import type { StyleGuideRule } from "../../helpers/StyleGuideRuleAdapter";
import type { ForType } from "../../types";

export const forTypesFieldSchema = z.array(z.object({ value: z.string(), label: z.string() }));

export function mapForTypesToFormValue(forTypes: Array<{ code: ForType }>) {
	return forTypes.map((typeObj) => ({
		value: typeObj.code,
		label:
			typeObj.code === "heading"
				? t("enterprise.admin.check.rules-types.heading")
				: t("enterprise.admin.check.rules-types.plainText"),
	}));
}

function collectExistingRuleNames(currentRuleGuid: string, allRules: StyleGuideRule[]): string[] {
	return allRules.filter((r) => r.getModel().guid !== currentRuleGuid).map((r) => r.getName());
}

export function validateRuleNameUniqueness(currentRuleGuid: string, allRules: StyleGuideRule[]) {
	return (name: string) => {
		const existingNames = collectExistingRuleNames(currentRuleGuid, allRules);
		return !existingNames.includes(name);
	};
}
