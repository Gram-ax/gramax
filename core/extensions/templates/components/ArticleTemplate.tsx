import BaseArticleView from "@ext/articleProvider/components/BaseArticleView";
import { ProviderItemProps } from "@ext/articleProvider/models/types";
import t from "@ext/localization/locale/translate";
import getArticleWithTitle from "@ext/markdown/elements/article/edit/logic/getArticleWithTitle";
import { Placeholder } from "@ext/markdown/elements/placeholder/placeholder";
import TemplateService from "@ext/templates/components/TemplateService";
import { JSONContent } from "@tiptap/core";

interface ArticleTemplateProps {
	item: ProviderItemProps;
}

const ArticleTemplate = ({ item }: ArticleTemplateProps) => {
	const { templates } = TemplateService.value;

	const updateContent = (id: string, content: JSONContent, title: string) => {
		const newTemplate = templates.get(id);
		if (!newTemplate) return;

		if (newTemplate.title !== title) {
			newTemplate.title = title.trim();
		}

		let newContent = { ...content };
		newContent.content.shift();
		newContent = getArticleWithTitle(title, newContent);

		TemplateService.setItems(Array.from(templates.values()));
	};

	const onCloseClick = () => {
		TemplateService.closeItem();
	};

	return (
		<BaseArticleView
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
			extensionsOptions={{ isTemplateInstance: false }}
			item={item}
			menuOptions={{ isTemplate: true }}
			onCloseClick={onCloseClick}
			onUpdate={updateContent}
			providerType="template"
		/>
	);
};

export default ArticleTemplate;
