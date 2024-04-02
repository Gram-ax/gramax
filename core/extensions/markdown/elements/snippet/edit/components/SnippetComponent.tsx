import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import useLocalize from "@ext/localization/useLocalize";
import Renderer from "@ext/markdown/core/render/components/Renderer";
import getComponents from "@ext/markdown/core/render/components/getComponents/getComponents";
import SnippetUpdateService from "@ext/markdown/elements/snippet/edit/components/SnippetUpdateService";
import onSnippetEdit from "@ext/markdown/elements/snippet/edit/logic/onSnippetEdit";
import Snippet from "@ext/markdown/elements/snippet/render/components/Snippet";
import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { ReactElement, useEffect, useState } from "react";
import Focus from "../../../../elementsUtils/wrappers/Focus";

const SnippetComponent = ({ node, getPos }: NodeViewProps): ReactElement => {
	const [content, setContent] = useState(node.attrs.content);
	const apiUrlCreator = ApiUrlCreatorService.value;
	const snippetDeleteConfirmText = `${useLocalize("deleteSnippetConfirmNotUse")}. ${useLocalize(
		"deleteSnippetConfirm",
	)}`;

	useEffect(() => {
		SnippetUpdateService.addUpdateContent(node.attrs.id, setContent);
		return () => SnippetUpdateService.removeUpdateContent(node.attrs.id, setContent);
	}, []);

	return (
		<NodeViewWrapper as={"div"}>
			<Focus position={getPos()}>
				<div
					data-focusable="true"
					onClick={() => {
						if (content) onSnippetEdit(node.attrs.id, apiUrlCreator, snippetDeleteConfirmText);
					}}
				>
					<Snippet>{Renderer(content, { components: getComponents() })}</Snippet>
				</div>
			</Focus>
		</NodeViewWrapper>
	);
};

export default SnippetComponent;
