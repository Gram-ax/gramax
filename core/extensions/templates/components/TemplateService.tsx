import ApiUrlCreator from "@core-ui/ApiServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import ArticleViewService from "@core-ui/ContextServices/views/articleView/ArticleViewService";
import ArticleTemplate from "@ext/templates/components/ArticleTemplate";
import { ProviderItemProps } from "@ext/articleProvider/models/types";
import { createContext, useContext, useEffect, useState } from "react";
import { Property } from "@ext/properties/models";

export type TemplateContextType = {
	templates: Map<string, ProviderItemProps>;
	selectedID: string;
	properties: Map<string, Property>;
};

export const TemplateContext = createContext<TemplateContextType>({
	templates: new Map(),
	selectedID: null,
	properties: new Map(),
});

class TemplateService {
	private _setTemplates: (templates: Map<string, ProviderItemProps>) => void = () => {};
	private _setSelectedID: (selectedID: string) => void = () => {};
	private _setProperties: (properties: Map<string, Property>) => void = () => {};

	Init = ({ children }: { children: JSX.Element }): JSX.Element => {
		const articleProps = ArticlePropsService.value;
		const apiUrlCreator = ApiUrlCreatorService.value;

		const [templates, setTemplates] = useState<Map<string, ProviderItemProps>>(new Map());
		const [selectedID, setSelectedID] = useState<string>(null);
		const [properties, setProperties] = useState<Map<string, Property>>(new Map());

		this._setTemplates = setTemplates;
		this._setSelectedID = setSelectedID;
		this._setProperties = setProperties;

		const fetchCustomProperties = async () => {
			const url = apiUrlCreator.getTemplateProperties(articleProps.template);
			const res = await FetchService.fetch(url);
			if (!res.ok) return;

			const customProperties = (await res.json()) || [];
			setProperties(new Map(customProperties.map((prop) => [prop.name, prop])));
		};

		useEffect(() => {
			if (!articleProps.template) return setProperties(new Map());
			fetchCustomProperties();
		}, [articleProps.ref.path]);

		return (
			<TemplateContext.Provider value={{ templates, selectedID, properties }}>
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

	setProperties(properties: Map<string, Property>) {
		this._setProperties(properties);
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
