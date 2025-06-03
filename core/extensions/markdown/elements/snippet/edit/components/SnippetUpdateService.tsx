import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import { RenderableTreeNodes } from "@ext/markdown/core/render/logic/Markdoc";
import { SnippetRenderData } from "@ext/markdown/elements/snippet/edit/model/types";
import React from "react";

abstract class SnippetUpdateService {
	private static _setContents: Map<string, React.Dispatch<React.SetStateAction<RenderableTreeNodes>>[]> = new Map();

	static addUpdateContent(id: string, _setContent: React.Dispatch<React.SetStateAction<RenderableTreeNodes>>) {
		if (this._setContents.has(id)) this._setContents.get(id).push(_setContent);
		else this._setContents.set(id, [_setContent]);
	}

	static removeUpdateContent(id: string, _setContent: React.Dispatch<React.SetStateAction<RenderableTreeNodes>>) {
		if (!this._setContents.has(id)) return;
		this._setContents.set(
			id,
			this._setContents.get(id).filter((sc) => sc !== _setContent),
		);
	}

	static clearContent(id: string) {
		if (!this._setContents.has(id)) return;
		this._setContents.get(id).map((f) => f(null));
	}

	static async updateContent(id: string, apiUrlCreator: ApiUrlCreator) {
		const data = await this._getContentBtId(id, apiUrlCreator);
		this._setContents.get(id)?.map((f) => f(data.content));
	}

	private static async _getContentBtId(id: string, apiUrlCreator: ApiUrlCreator) {
		await FetchService.fetch(apiUrlCreator.clearArticlesContentWithSnippet(id));
		const res = await FetchService.fetch<SnippetRenderData>(apiUrlCreator.getSnippetRenderData(id));
		if (!res.ok) return;
		return res.json();
	}
}

export default SnippetUpdateService;
