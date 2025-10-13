import { JSONContent } from "@tiptap/core";
import SnippetService from "@ext/markdown/elements/snippet/edit/components/Tab/SnippetService";
import getArticleWithTitle from "@ext/markdown/elements/article/edit/logic/getArticleWithTitle";
import BaseArticleView from "@ext/articleProvider/components/BaseArticleView";
import { ProviderItemProps } from "@ext/articleProvider/models/types";
import t from "@ext/localization/locale/translate";
import { Placeholder } from "@ext/markdown/elements/placeholder/placeholder";
import ResourceService from "@ext/markdown/elements/copyArticles/resourceService";
import SnippetUpdateService from "@ext/markdown/elements/snippet/edit/components/SnippetUpdateService";
import ApiUrlCreator from "@core-ui/ContextServices/ApiUrlCreator";

const ArticleSnippet = ({ item }: { item: ProviderItemProps }) => {
	const { snippets } = SnippetService.value;
	const apiUrlCreator = ApiUrlCreator.value;

	const updateContent = (id: string, content: JSONContent, title: string) => {
		const newSnippet = snippets.get(id);
		if (!newSnippet) return;

		if (newSnippet.title !== title) {
			newSnippet.title = title.trim();
		}

		let newContent = { ...content };
		newContent.content.shift();
		newContent = getArticleWithTitle(title, newContent);

		SnippetService.setItems(Array.from(snippets.values()));
	};

	const onCloseClick = async () => {
		await SnippetUpdateService.updateContent(item.id, apiUrlCreator);
		SnippetService.closeItem();
	};

	return (
		<ResourceService.Provider id={item.id} provider="snippet">
			<BaseArticleView
				providerType="snippet"
				item={item}
				onUpdate={updateContent}
				onCloseClick={onCloseClick}
				extensionsOptions={{ isTemplateInstance: false, includeResources: true }}
				menuOptions={{ includeResources: true, fileName: item.id, isSmallEditor: true }}
				extensions={[
					Placeholder.configure({
						placeholder: ({ editor, node }) => {
							if (
								editor.state.doc.firstChild.type.name === "paragraph" &&
								editor.state.doc.firstChild === node
							)
								return t("forms.snippet-editor.props.title.name");

							if (
								node.type.name === "paragraph" &&
								editor.state.doc.content.child(1) === node &&
								editor.state.doc.content.childCount === 2
							)
								return t("forms.snippet-editor.props.content.name");
						},
					}),
				]}
			/>
		</ResourceService.Provider>
	);
};

export default ArticleSnippet;
