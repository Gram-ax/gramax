import HoverableActions from "@components/controls/HoverController/HoverableActions";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import t from "@ext/localization/locale/translate";
import Renderer from "@ext/markdown/core/render/components/Renderer";
import getComponents from "@ext/markdown/core/render/components/getComponents/getComponents";
import SnippetActions from "@ext/markdown/elements/snippet/edit/components/SnippetActions";
import SnippetUpdateService from "@ext/markdown/elements/snippet/edit/components/SnippetUpdateService";
import onSnippetDeleteCallback from "@ext/markdown/elements/snippet/edit/logic/onSnippetDeleteCallback";
import onSnippetEdit from "@ext/markdown/elements/snippet/edit/logic/onSnippetEdit";
import Snippet from "@ext/markdown/elements/snippet/render/components/Snippet";
import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { ReactElement, useEffect, useRef, useState } from "react";

const SnippetComponent = ({ node, editor, getPos }: NodeViewProps): ReactElement => {
	const [content, setContent] = useState(node.attrs.content);
	const [isHovered, setIsHovered] = useState(false);
	const apiUrlCreator = ApiUrlCreatorService.value;
	const snippetDeleteConfirmText = `${t("delete-snippet-confirm-not-use")}. ${t("delete-snippet-confirm")}`;
	const articleProps = ArticlePropsService.value;
	const currentArticlePathname = articleProps.pathname;
	const hoverElementRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		SnippetUpdateService.addUpdateContent(node.attrs.id, setContent);
		return () => SnippetUpdateService.removeUpdateContent(node.attrs.id, setContent);
	}, []);

	const onClickEdit = () => {
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
	};

	const handleDelete = () => {
		const position = getPos();
		editor.commands.deleteRange({ from: position, to: position + node.nodeSize });
	};

	return (
		<NodeViewWrapper ref={hoverElementRef} as={"div"} draggable={true} data-drag-handle>
			<HoverableActions
				hoverElementRef={hoverElementRef}
				setIsHovered={setIsHovered}
				isHovered={isHovered}
				rightActions={<SnippetActions onClickEdit={onClickEdit} onClickDelete={handleDelete} />}
			>
				<div>
					<Snippet>{Renderer(content, { components: getComponents() })}</Snippet>
				</div>
			</HoverableActions>
		</NodeViewWrapper>
	);
};

export default SnippetComponent;
