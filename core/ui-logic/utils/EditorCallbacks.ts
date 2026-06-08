import type { Router } from "@core/Api/Router";
import { uniqueName } from "@core/utils/uniqueName";
import type ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import type { ResourceServiceType } from "@core-ui/ContextServices/ResourceService/ResourceService";
import type { BaseEditorContext, EditorContext, EditorPasteHandler } from "@core-ui/stores/EditorStore";
import { paste } from "@ext/markdown/elements/copyArticles/handlers/paste";
import imageHandlePaste from "@ext/markdown/elements/image/edit/logic/imageHandlePaste";
import { useCallback } from "react";

export const createHandlePasteCallback = (resourceService: ResourceServiceType): EditorPasteHandler => {
	return (view, event, _slice, apiUrlCreator, articleProps, catalogProps) => {
		if (!event.clipboardData) return false;
		if (event.clipboardData.files.length !== 0)
			return imageHandlePaste(view, event, articleProps.fileName, resourceService);

		return paste({ view, event, apiUrlCreator, resourceService, catalogProps });
	};
};

export const createOnUpdateCallback = (): ((editorContext: EditorContext) => Promise<void>) => {
	return useCallback(async (editorContext: EditorContext) => {
		const { editor, apiUrlCreator } = editorContext;
		const json = editor.getJSON();
		json.content.shift();
		const articleContentEdit = JSON.stringify(json);
		const url = apiUrlCreator.updateArticleContent();
		await FetchService.fetch(url, articleContentEdit, MimeTypes.json);
	}, []);
};

export const createUpdateTitleFunction = () => {
	return async (context: BaseEditorContext, router: Router, title: string, fileName?: string) => {
		const { articleProps, apiUrlCreator } = context;

		articleProps.title = title;
		articleProps.fileName = fileName
			? uniqueName(
					fileName,
					await GetBrotherFileNames(articleProps.ref.path, apiUrlCreator, articleProps.fileName, fileName),
				)
			: articleProps.fileName;

		const url = apiUrlCreator.updateItemProps(articleProps.ref.path, articleProps.fileName);
		const res = await FetchService.fetch(
			url,
			JSON.stringify({
				...articleProps,
				properties: context.propertyService?.articleProperties.map((prop) => ({
					id: prop.id,
					value: prop.value,
				})),
			}),
			MimeTypes.json,
		);

		if (fileName && res.ok) {
			const data = await res.json();
			if (!data) return;
			const { pathname, ref } = data;
			articleProps.ref = ref;
			pathname && router.pushPath(pathname, undefined, { replace: true });
		}
	};
};

const GetBrotherFileNames = async (
	articlePath: string,
	apiUrlCreator: ApiUrlCreator,
	fileName?: string,
	newFileName?: string,
): Promise<string[]> => {
	const response = await FetchService.fetch(
		apiUrlCreator.getArticleBrotherFileNames(articlePath, fileName, newFileName),
	);
	if (!response.ok) return;
	const data = (await response.json()) as string[];
	return data;
};
