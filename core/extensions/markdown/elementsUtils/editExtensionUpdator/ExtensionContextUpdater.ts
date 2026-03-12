/** biome-ignore-all lint/suspicious/noExplicitAny: it's ok */
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import ArticleRefService from "@core-ui/ContextServices/ArticleRef";
import IsMacService from "@core-ui/ContextServices/IsMac";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import PlatformService from "@core-ui/ContextServices/PlatformService";
import ResourceService from "@core-ui/ContextServices/ResourceService/ResourceService";
import SourceDataService from "@core-ui/ContextServices/SourceDataService";
import useWatch from "@core-ui/hooks/useWatch";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import type ExtensionUpdaterRules from "@ext/markdown/elementsUtils/editExtensionUpdator/rules/ExtensionUpdaterRules";
import type { Editor, Extensions } from "@tiptap/react";
import { useMemo } from "react";
import ApiUrlCreatorService from "../../../../ui-logic/ContextServices/ApiUrlCreator";
import ThemeService from "../../../Theme/components/ThemeService";
import attributeUpdaterExtension from "./attributeUpdaterExtension";
import type { ExtensionFilter } from "./rules/ExtensionFilter";
import { getExtensionUpdaterRules } from "./rules/getExtensionUpdaterRules";

const useUpdateExtensionsWithService = (
	editor: Editor,
	extensionUpdatersRules: ExtensionUpdaterRules[],
	optionsKey: string,
	serviceValue: any,
): void => {
	useWatch(() => {
		const extensions = editor.extensionManager.extensions;

		extensionUpdatersRules
			.filter((x) => x.options[optionsKey])
			.forEach((extensionUpdater) => {
				let filteredExtensons: Extensions = [];
				if (extensionUpdater.filter) filteredExtensons = filterExtensions(extensionUpdater.filter, extensions);
				if (extensionUpdater.options) updateExistingOptions(extensionUpdater.options, filteredExtensons);
			});
	}, [serviceValue]);
};

const updateExistingOptions = (options: { [key: string]: any }, extensions: Extensions) => {
	const optionsKeys = Object.keys(options);

	return extensions.map((extension) => {
		optionsKeys.forEach((key) => {
			extension.options[key] = options[key];
		});
	});
};

const filterExtensions = (extensionUpdaterFilter: ExtensionFilter, extensions: Extensions): Extensions => {
	return extensions
		.map((e) => {
			if (extensionUpdaterFilter(e)) return e;
		})
		.filter((x) => x);
};

const updateOptions = (options: { [key: string]: any }, extensions: Extensions): Extensions => {
	const optionsKeys = Object.keys(options);

	return extensions.map((extension) => {
		const props = extension.options;
		optionsKeys.forEach((key) => {
			props[key] = options[key];
		});
		return extension.configure(props);
	});
};

const useExtendExtensionsWithContext = (extensions: Extensions): Extensions => {
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

	// biome-ignore lint/correctness/useExhaustiveDependencies: it's ok
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

			if (extensionUpdater.filter) filteredExtensons = filterExtensions(extensionUpdater.filter, extensions);
			if (extensionUpdater.options)
				updatedExtensions = updateOptions(extensionUpdater.options, filteredExtensons);
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
};

const useUpdateContextInExtensions = (editor: Editor): void => {
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

	useUpdateExtensionsWithService(editor, extensionUpdatersRules, "theme", theme);
	useUpdateExtensionsWithService(editor, extensionUpdatersRules, "isMac", isMac);
	useUpdateExtensionsWithService(editor, extensionUpdatersRules, "articleProps", articleProps);
	useUpdateExtensionsWithService(editor, extensionUpdatersRules, "catalogProps", catalogProps);
	useUpdateExtensionsWithService(editor, extensionUpdatersRules, "apiUrlCreator", apiUrlCreator);
	useUpdateExtensionsWithService(editor, extensionUpdatersRules, "pageDataContext", pageDataContext);
	useUpdateExtensionsWithService(editor, extensionUpdatersRules, "articleRef", articleRef);
	useUpdateExtensionsWithService(editor, extensionUpdatersRules, "resourceService", resourceService);
	useUpdateExtensionsWithService(editor, extensionUpdatersRules, "sourceData", sourceData);
};

export { useExtendExtensionsWithContext, useUpdateContextInExtensions };
