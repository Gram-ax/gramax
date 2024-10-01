import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import t from "@ext/localization/locale/translate";
import Renderer from "@ext/markdown/core/render/components/Renderer";
import getComponents from "@ext/markdown/core/render/components/getComponents/getComponents";
import SnippetUpdateService from "@ext/markdown/elements/snippet/edit/components/SnippetUpdateService";
import onSnippetDeleteCallback from "@ext/markdown/elements/snippet/edit/logic/onSnippetDeleteCallback";
import onSnippetEdit from "@ext/markdown/elements/snippet/edit/logic/onSnippetEdit";
import Snippet from "@ext/markdown/elements/snippet/render/components/Snippet";
import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { ReactElement, useEffect, useState } from "react";

const SnippetComponent = ({ node, editor }: NodeViewProps): ReactElement => {
	const [content, setContent] = useState(node.attrs.content);
	const apiUrlCreator = ApiUrlCreatorService.value;
	const snippetDeleteConfirmText = `${t("delete-snippet-confirm-not-use")}. ${t("delete-snippet-confirm")}`;
	const articleProps = ArticlePropsService.value;
	const currentArticlePathname = articleProps.pathname;

	useEffect(() => {
		SnippetUpdateService.addUpdateContent(node.attrs.id, setContent);
		return () => SnippetUpdateService.removeUpdateContent(node.attrs.id, setContent);
	}, []);

	return (
		<NodeViewWrapper as={"div"} draggable={true} data-drag-handle className="focus-pointer-events">
			<div
				onClick={() => {
					if (!content) return;
					onSnippetEdit({
						snippetId: node.attrs.id,
						apiUrlCreator,
						snippetDeleteConfirmText,
						onDelete: (usedInArticles) => {
							onSnippetDeleteCallback(usedInArticles, currentArticlePathname);
						},
						onClose: () => {
							editor.commands.focus(editor.state.selection.anchor);
						},
					});
				}}
			>
				<Snippet>{Renderer(content, { components: getComponents() })}</Snippet>
			</div>
		</NodeViewWrapper>
	);
};

export default SnippetComponent;
