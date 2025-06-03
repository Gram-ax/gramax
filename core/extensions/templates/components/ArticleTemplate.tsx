import BaseArticleView from "@ext/articleProvider/components/BaseArticleView";
import { ProviderItemProps } from "@ext/articleProvider/models/types";
import t from "@ext/localization/locale/translate";
import getArticleWithTitle from "@ext/markdown/elements/article/edit/logic/getArticleWithTitle";
import TemplateService from "@ext/templates/components/TemplateService";
import { JSONContent } from "@tiptap/core";
import { Placeholder } from "@ext/markdown/elements/placeholder/placeholder";
import FetchService from "@core-ui/ApiServices/FetchService";
import useWatch from "@core-ui/hooks/useWatch";
import ApiUrlCreator from "@core-ui/ContextServices/ApiUrlCreator";

interface ArticleTemplateProps {
	item: ProviderItemProps;
}

const ArticleTemplate = ({ item }: ArticleTemplateProps) => {
	const { templates } = TemplateService.value;
	const apiUrlCreator = ApiUrlCreator.value;

	const updateContent = (id: string, content: JSONContent, title: string) => {
		const newTemplate = templates.get(id);
		if (!newTemplate) return;

		if (newTemplate.title !== title) {
			newTemplate.title = title.trim();
		}

		let newContent = { ...content };
		newContent.content.shift();
		newContent = getArticleWithTitle(title, newContent);

		TemplateService.setTemplates(Array.from(templates.values()));
	};

	const onCloseClick = () => {
		TemplateService.closeTemplate();
	};

	const fetchProperties = async () => {
		const res = await FetchService.fetch(apiUrlCreator.getTemplateProperties(item.id));
		if (!res.ok) return;

		const properties = await res.json();
		TemplateService.setProperties(new Map(properties.map((prop) => [prop.name, prop])));
	};

	const fetchData = async () => {
		await fetchProperties();
	};

	useWatch(() => {
		fetchData();
	}, [item.id]);

	return (
		<BaseArticleView
			providerType="template"
			item={item}
			onUpdate={updateContent}
			onCloseClick={onCloseClick}
			menuOptions={{ isTemplate: true }}
			extensionsOptions={{ isTemplateInstance: false }}
			extensions={[
				Placeholder.configure({
					placeholder: ({ editor, node }) => {
						if (
							editor.state.doc.firstChild.type.name === "paragraph" &&
							editor.state.doc.firstChild === node
						)
							return t("template.placeholders.title");

						if (
							node.type.name === "paragraph" &&
							editor.state.doc.content.child(1) === node &&
							editor.state.doc.content.childCount === 2
						)
							return t("template.placeholders.content");
					},
				}),
			]}
		/>
	);
};

export default ArticleTemplate;
