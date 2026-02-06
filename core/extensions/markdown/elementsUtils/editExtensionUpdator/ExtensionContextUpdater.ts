import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import ArticleRefService from "@core-ui/ContextServices/ArticleRef";
import IsMacService from "@core-ui/ContextServices/IsMac";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import PlatformService from "@core-ui/ContextServices/PlatformService";
import SourceDataService from "@core-ui/ContextServices/SourceDataService";
import useWatch from "@core-ui/hooks/useWatch";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import ResourceService from "@ext/markdown/elements/copyArticles/resourceService";
import ExtensionUpdaterRules from "@ext/markdown/elementsUtils/editExtensionUpdator/rules/ExtensionUpdaterRules";
import { Editor, Extensions } from "@tiptap/react";
import { useMemo } from "react";
import ApiUrlCreatorService from "../../../../ui-logic/ContextServices/ApiUrlCreator";
import ThemeService from "../../../Theme/components/ThemeService";
import attributeUpdaterExtension from "./attributeUpdaterExtension";
import { ExtensionFilter } from "./rules/ExtensionFilter";
import { getExtensionUpdaterRules } from "./rules/getExtensionUpdaterRules";

export default abstract class ExtensionContextUpdater {
	static useExtendExtensionsWithContext(extensions: Extensions): Extensions {
		const theme = ThemeService.value;
		const isMac = IsMacService.value;
		const articleProps = ArticlePropsService.value;
		const catalogProps = useCatalogPropsStore((state) => state.data);
		const apiUrlCreator = ApiUrlCreatorService.value;
		const pageDataContext = PageDataContextService.value;
		const articleRef = ArticleRefService.value;
		const resourceService = ResourceService.value;
		const platform = PlatformService.value;
		const sourceData = SourceDataService.value;

		return useMemo(() => {
			const extensionUpdatersRules = getExtensionUpdaterRules(
				theme,
				isMac,
				articleProps,
				catalogProps,
				apiUrlCreator,
				pageDataContext,
				articleRef,
				resourceService,
				platform,
				sourceData,
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

			const filteredExtensions = extensions.filter((e) =>
				updatedExtensionsNames.every((name) => name !== e.name),
			);

			return [...attributeUpdaters, ...updatedExtensions, ...filteredExtensions];
		}, [
			extensions,
			theme,
			isMac,
			articleProps,
			catalogProps,
			apiUrlCreator,
			pageDataContext,
			articleRef,
			resourceService,
		]);
	}

	static useUpdateContextInExtensions(editor: Editor): void {
		const theme = ThemeService.value;
		const isMac = IsMacService.value;
		const articleProps = ArticlePropsService.value;
		const catalogProps = useCatalogPropsStore((state) => state.data);
		const apiUrlCreator = ApiUrlCreatorService.value;
		const pageDataContext = PageDataContextService.value;
		const articleRef = ArticleRefService.value;
		const resourceService = ResourceService.value;
		const platform = PlatformService.value;
		const sourceData = SourceDataService.value;

		const extensionUpdatersRules = getExtensionUpdaterRules(
			theme,
			isMac,
			articleProps,
			catalogProps,
			apiUrlCreator,
			pageDataContext,
			articleRef,
			resourceService,
			platform,
			sourceData,
		);

		this._useUpdateExtensionsWithService(editor, extensionUpdatersRules, "theme", theme);
		this._useUpdateExtensionsWithService(editor, extensionUpdatersRules, "isMac", isMac);
		this._useUpdateExtensionsWithService(editor, extensionUpdatersRules, "articleProps", articleProps);
		this._useUpdateExtensionsWithService(editor, extensionUpdatersRules, "catalogProps", catalogProps);
		this._useUpdateExtensionsWithService(editor, extensionUpdatersRules, "apiUrlCreator", apiUrlCreator);
		this._useUpdateExtensionsWithService(editor, extensionUpdatersRules, "pageDataContext", pageDataContext);
		this._useUpdateExtensionsWithService(editor, extensionUpdatersRules, "articleRef", articleRef);
		this._useUpdateExtensionsWithService(editor, extensionUpdatersRules, "resourceService", resourceService);
		this._useUpdateExtensionsWithService(editor, extensionUpdatersRules, "sourceData", sourceData);
	}

	private static _useUpdateExtensionsWithService(
		editor: Editor,
		extensionUpdatersRules: ExtensionUpdaterRules[],
		optionsKey: string,
		serviceValue: any,
	): void {
		useWatch(() => {
			const extensions = editor.extensionManager.extensions;

			extensionUpdatersRules
				.filter((x) => x.options[optionsKey])
				.forEach((extensionUpdater) => {
					let filteredExtensons: Extensions = [];
					if (extensionUpdater.filter)
						filteredExtensons = this._filterExtensions(extensionUpdater.filter, extensions);
					if (extensionUpdater.options)
						this._updateExistingOptions(extensionUpdater.options, filteredExtensons);
				});
		}, [serviceValue]);
	}

	private static _updateExistingOptions(options: { [key: string]: any }, extensions: Extensions) {
		const optionsKeys = Object.keys(options);

		return extensions.map((extension) => {
			optionsKeys.forEach((key) => (extension.options[key] = options[key]));
		});
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
