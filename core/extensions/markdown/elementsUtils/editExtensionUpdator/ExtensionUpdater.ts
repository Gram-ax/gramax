import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import IsMacService from "@core-ui/ContextServices/IsMac";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import { Extensions } from "@tiptap/react";
import ApiUrlCreatorService from "../../../../ui-logic/ContextServices/ApiUrlCreator";
import ThemeService from "../../../Theme/components/ThemeService";
import attributeUpdaterExtension from "./attributeUpdaterExtension";
import { ExtensionFilter } from "./rules/ExtensionFilter";
import { getExtensionUpdaterRules } from "./rules/getExtensionUpdaterRules";
import ArticleRefService from "@core-ui/ContextServices/ArticleRef";

export default abstract class ExtensionUpdater {
	static getUpdatedExtension(extensions: Extensions): Extensions {
		const theme = ThemeService.value;
		const isMac = IsMacService.value;
		const articleProps = ArticlePropsService.value;
		const catalogProps = CatalogPropsService.value;
		const apiUrlCreator = ApiUrlCreatorService.value;
		const pageDataContext = PageDataContextService.value;
		const articleRef = ArticleRefService.value;
		const extensionUpdatersRules = getExtensionUpdaterRules(
			theme,
			isMac,
			articleProps,
			catalogProps,
			apiUrlCreator,
			pageDataContext,
			articleRef,
		);

		const result = {};
		const attributeUpdaters: Extensions = [];

		extensionUpdatersRules.forEach((extensionUpdater) => {
			let updatedExtensions: Extensions = [];
			let filteredExtensons: Extensions = [];

			if (extensionUpdater.filter)
				filteredExtensons = this._filterExtensions(extensionUpdater.filter, extensions);
			if (extensionUpdater.options)
				updatedExtensions = this._updateOptions(extensionUpdater.options, filteredExtensons);
			const updatedExtensionsNames = filteredExtensons.map((e) => e.name);

			updatedExtensions.forEach((e) => {
				result[e.name] = e;
			});

			if (extensionUpdater.attributes) {
				attributeUpdaters.push(
					attributeUpdaterExtension.configure({
						types: updatedExtensionsNames,
						attributes: JSON.stringify(extensionUpdater.attributes),
					}),
				);
			}
		});

		const updatedExtensions: Extensions = Object.values(result);
		const updatedExtensionsNames = updatedExtensions.map((e) => e.name);

		const filteredExtensions = extensions.filter((e) => updatedExtensionsNames.every((name) => name !== e.name));

		return [...attributeUpdaters, ...updatedExtensions, ...filteredExtensions];
	}

	private static _filterExtensions = (
		extensionUpdaterFilter: ExtensionFilter,
		extensions: Extensions,
	): Extensions => {
		return extensions
			.map((e) => {
				if (extensionUpdaterFilter(e)) return e;
			})
			.filter((x) => x);
	};

	private static _updateOptions = (options: { [key: string]: any }, extensions: Extensions): Extensions => {
		const optionsKeys = Object.keys(options);

		return extensions.map((extension) => {
			const props = extension.options;
			optionsKeys.forEach((key) => (props[key] = options[key]));
			return extension.configure(props);
		});
	};
}
