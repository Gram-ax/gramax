import WorkspaceService from "@core-ui/ContextServices/Workspace";
import t from "@ext/localization/locale/translate";
import { useMemo } from "react";
import type { FormSelectValues } from "../logic/createFormSchema";
import Schema from "../model/CatalogEditProps.schema.json";

export const useFormSelectValues = (): FormSelectValues => {
	const workspace = WorkspaceService.current();

	const languages = useMemo(
		() =>
			Schema.properties.language.enum.map((shortLang) => ({
				value: shortLang,
				children: t(`${Schema.properties.language.see}.${shortLang}` as any),
			})),
		[],
	);

	const cardColors = useMemo(
		() => Schema.properties.style.enum.map((color) => t(`${Schema.properties.style.see}.${color}` as any)),
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
			Schema.properties.syntax.enum.map((syntax) => ({
				value: syntax,
				children: syntax,
			})),
		[],
	);

	return { workspaceGroups, cardColors, languages, syntaxes };
};
