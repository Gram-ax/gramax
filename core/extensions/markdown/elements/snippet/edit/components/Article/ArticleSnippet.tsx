import ApiUrlCreator from "@core-ui/ContextServices/ApiUrlCreator";
import BaseArticleView from "@ext/articleProvider/components/BaseArticleView";
import { ProviderItemProps } from "@ext/articleProvider/models/types";
import t from "@ext/localization/locale/translate";
import getArticleWithTitle from "@ext/markdown/elements/article/edit/logic/getArticleWithTitle";
import ResourceService from "@ext/markdown/elements/copyArticles/resourceService";
import { Placeholder } from "@ext/markdown/elements/placeholder/placeholder";
import SnippetUpdateService from "@ext/markdown/elements/snippet/edit/components/SnippetUpdateService";
import SnippetService from "@ext/markdown/elements/snippet/edit/components/Tab/SnippetService";
import { JSONContent } from "@tiptap/core";

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
				extensionsOptions={{ isTemplateInstance: false, includeResources: true }}
				item={item}
				menuOptions={{ includeResources: true, fileName: item.id, isSmallEditor: true }}
				onCloseClick={onCloseClick}
				onUpdate={updateContent}
				providerType="snippet"
			/>
		</ResourceService.Provider>
	);
};

export default ArticleSnippet;
