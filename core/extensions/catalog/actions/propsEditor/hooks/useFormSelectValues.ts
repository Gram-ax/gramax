import Style from "@components/HomePage/Cards/model/Style";
import { ContentLanguage } from "@ext/localization/core/model/Language";
import { tString } from "@ext/localization/locale/translate";
import { Syntax } from "@ext/markdown/core/edit/logic/Formatter/Formatters/typeFormats/model/Syntax";
import { useMemo } from "react";
import type { FormSelectValues } from "../logic/createFormSchema";

export const useFormSelectValues = (): FormSelectValues => {
	const languages = useMemo(
		() =>
			Object.keys(ContentLanguage).map((shortLang) => ({
				value: shortLang,
				children: tString(`language.${shortLang}`),
			})),
		[],
	);

	const cardColors = useMemo(
		() =>
			Object.values(Style).map((color) => {
				return {
					value: color,
					children: tString(`catalog.style.${color}`),
				};
			}),
		[],
	);

	const syntaxes = useMemo(
		() =>
			Object.values(Syntax).map((syntax) => ({
				value: syntax,
				children: syntax,
			})),
		[],
	);

	return { cardColors, languages, syntaxes };
};
