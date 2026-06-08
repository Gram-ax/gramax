import ApiUrlCreator from "@core-ui/ContextServices/ApiUrlCreator";
import ResourceService from "@core-ui/ContextServices/ResourceService/ResourceService";
import BaseArticleView from "@ext/articleProvider/components/BaseArticleView";
import type { ProviderItemProps } from "@ext/articleProvider/models/types";
import t from "@ext/localization/locale/translate";
import getArticleWithTitle from "@ext/markdown/elements/article/edit/logic/getArticleWithTitle";
import FragmentUpdateService from "@ext/markdown/elements/fragment/edit/components/FragmentUpdateService";
import FragmentService from "@ext/markdown/elements/fragment/edit/components/Tab/FragmentService";
import { Placeholder } from "@ext/markdown/elements/placeholder/placeholder";
import type { JSONContent } from "@tiptap/core";

const ArticleFragment = ({ item }: { item: ProviderItemProps }) => {
	const { fragments } = FragmentService.value;
	const apiUrlCreator = ApiUrlCreator.value;

	const updateContent = (id: string, content: JSONContent, title: string) => {
		const newFragment = fragments.get(id);
		if (!newFragment) return;

		if (newFragment.title !== title) {
			newFragment.title = title.trim();
		}

		let newContent = { ...content };
		newContent.content.shift();
		newContent = getArticleWithTitle(title, newContent);

		FragmentService.setItems(Array.from(fragments.values()));
	};

	const onCloseClick = async () => {
		await FragmentUpdateService.updateContent(item.id, apiUrlCreator);
		FragmentService.closeItem();
	};

	return (
		<ResourceService.Provider id={item.id} provider="fragment">
			<BaseArticleView
				extensions={[
					Placeholder.configure({
						placeholder: ({ editor, node }) => {
							if (
								editor.state.doc.firstChild.type.name === "paragraph" &&
								editor.state.doc.firstChild === node
							)
								return t("forms.fragment-editor.props.title.name");

							if (
								node.type.name === "paragraph" &&
								editor.state.doc.content.child(1) === node &&
								editor.state.doc.content.childCount === 2
							)
								return t("forms.fragment-editor.props.content.name");
						},
					}),
				]}
				extensionsOptions={{ isTemplateInstance: false, includeResources: true }}
				item={item}
				menuOptions={{ includeResources: true, fileName: item.id, isSmallEditor: true }}
				onCloseClick={onCloseClick}
				onUpdate={updateContent}
				providerType="fragment"
			/>
		</ResourceService.Provider>
	);
};

export default ArticleFragment;
