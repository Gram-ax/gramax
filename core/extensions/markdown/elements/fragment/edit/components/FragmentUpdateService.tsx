import type ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import type { RenderableTreeNodes } from "@ext/markdown/core/render/logic/Markdoc";
import type { FragmentRenderData } from "@ext/markdown/elements/fragment/edit/model/types";
import type React from "react";

const setContents: Map<string, React.Dispatch<React.SetStateAction<RenderableTreeNodes>>[]> = new Map();

async function getContentById(id: string, apiUrlCreator: ApiUrlCreator) {
	await FetchService.fetch(apiUrlCreator.clearArticlesContentWithFragment(id));
	const res = await FetchService.fetch<FragmentRenderData>(apiUrlCreator.getFragmentRenderData(id));
	if (!res.ok) return;
	return res.json();
}

const FragmentUpdateService = {
	addUpdateContent(id: string, SetContent: React.Dispatch<React.SetStateAction<RenderableTreeNodes>>) {
		if (setContents.has(id)) setContents.get(id).push(SetContent);
		else setContents.set(id, [SetContent]);
	},

	removeUpdateContent(id: string, SetContent: React.Dispatch<React.SetStateAction<RenderableTreeNodes>>) {
		if (!setContents.has(id)) return;
		setContents.set(
			id,
			setContents.get(id).filter((sc) => sc !== SetContent),
		);
	},

	clearContent(id: string) {
		if (!setContents.has(id)) return;
		setContents.get(id).map((f) => f(null));
	},

	async updateContent(id: string, apiUrlCreator: ApiUrlCreator) {
		const data = await getContentById(id, apiUrlCreator);
		setContents.get(id)?.map((f) => f(data.content));
	},
};

export default FragmentUpdateService;
