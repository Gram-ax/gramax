import WorkspaceService from "@core-ui/ContextServices/Workspace";
import { tString } from "@ext/localization/locale/translate";
import { useMemo } from "react";
import type { FormSelectValues } from "../logic/createFormSchema";
import { ContentLanguage } from "@ext/localization/core/model/Language";
import Style from "@components/HomePage/Cards/model/Style";
import { Syntax } from "@ext/markdown/core/edit/logic/Formatter/Formatters/typeFormats/model/Syntax";

export const useFormSelectValues = (): FormSelectValues => {
	const workspace = WorkspaceService.current();

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

	const workspaceGroups = useMemo(
		() =>
			Object.entries(workspace?.sections || workspace?.groups || {}).map(([key, group]) => ({
				value: key,
				children: group.title,
			})),
		[workspace?.groups, workspace?.sections],
	);

	const syntaxes = useMemo(
		() =>
			Object.values(Syntax).map((syntax) => ({
				value: syntax,
				children: syntax,
			})),
		[],
	);

	return { workspaceGroups, cardColors, languages, syntaxes };
};
