import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import ArticleViewService from "@core-ui/ContextServices/views/articleView/ArticleViewService";
import ArticleTemplate from "@ext/templates/components/ArticleTemplate";
import { TemplateProps } from "@ext/templates/models/types";
import { createContext, useContext, useState } from "react";

export type TemplateContextType = {
	templates: Map<string, TemplateProps>;
	selectedID: string;
};

export const TemplateContext = createContext<TemplateContextType>({
	templates: new Map(),
	selectedID: null,
});

class TemplateService {
	private _setTemplates: (templates: Map<string, TemplateProps>) => void = () => {};
	private _setSelectedID: (selectedID: string) => void = () => {};

	Init = ({ children }: { children: JSX.Element }): JSX.Element => {
		const [templates, setTemplates] = useState<Map<string, TemplateProps>>(new Map());
		const [selectedID, setSelectedID] = useState<string>(null);

		this._setTemplates = setTemplates;
		this._setSelectedID = setSelectedID;

		return <TemplateContext.Provider value={{ templates, selectedID }}>{children}</TemplateContext.Provider>;
	};

	get value(): TemplateContextType {
		return useContext(TemplateContext);
	}

	async fetchTemplates(apiUrlCreator: ApiUrlCreator) {
		const url = apiUrlCreator.getTemplates();
		const res = await FetchService.fetch(url);

		if (!res.ok) return;
		const templates = await res.json();

		this.setTemplates(templates);
	}

	setTemplates(templates: TemplateProps[]) {
		this._setTemplates(new Map(templates.map((template) => [template.id, template])));
	}

	closeTemplate() {
		ArticleViewService.setDefaultView();
		this._setSelectedID(null);
	}

	openTemplate(template: TemplateProps) {
		ArticleViewService.setView(() => <ArticleTemplate template={template} />);
		this._setSelectedID(template.id);
	}
}

export default new TemplateService();
