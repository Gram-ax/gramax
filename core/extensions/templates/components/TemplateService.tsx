import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import ArticleViewService from "@core-ui/ContextServices/views/articleView/ArticleViewService";
import ArticleTemplate from "@ext/templates/components/ArticleTemplate";
import { ProviderItemProps } from "@ext/articleProvider/models/types";
import { createContext, useContext, useState } from "react";

export type TemplateContextType = {
	templates: Map<string, ProviderItemProps>;
	selectedID: string;
};

export const TemplateContext = createContext<TemplateContextType>({
	templates: new Map(),
	selectedID: null,
});

class TemplateService {
	private _setTemplates: (templates: Map<string, ProviderItemProps>) => void = () => {};
	private _setSelectedID: (selectedID: string) => void = () => {};

	Init = ({ children }: { children: JSX.Element }): JSX.Element => {
		const [templates, setTemplates] = useState<Map<string, ProviderItemProps>>(new Map());
		const [selectedID, setSelectedID] = useState<string>(null);

		this._setTemplates = setTemplates;
		this._setSelectedID = setSelectedID;
		return (
			<TemplateContext.Provider value={{ templates, selectedID }}>
				{children}
			</TemplateContext.Provider>
		);
	};

	get value(): TemplateContextType {
		return useContext(TemplateContext);
	}

	async fetchTemplates(apiUrlCreator: ApiUrlCreator) {
		const url = apiUrlCreator.getArticleListInGramaxDir("template");
		const res = await FetchService.fetch(url);

		if (!res.ok) return;
		const templates = await res.json();

		this.setTemplates(templates);
	}

	setTemplates(templates: ProviderItemProps[]) {
		this._setTemplates(new Map(templates.map((template) => [template.id, template])));
	}

	closeTemplate() {
		ArticleViewService.setDefaultView();
		this._setSelectedID(null);
	}

	openTemplate(template: ProviderItemProps) {
		ArticleViewService.setView(() => <ArticleTemplate item={template} />);
		this._setSelectedID(template.id);
	}
}

export default new TemplateService();
