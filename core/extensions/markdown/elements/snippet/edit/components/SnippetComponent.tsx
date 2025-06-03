import HoverableActions from "@components/controls/HoverController/HoverableActions";
import Renderer from "@ext/markdown/core/render/components/Renderer";
import getComponents from "@ext/markdown/core/render/components/getComponents/getComponents";
import SnippetActions from "@ext/markdown/elements/snippet/edit/components/SnippetActions";
import SnippetUpdateService from "@ext/markdown/elements/snippet/edit/components/SnippetUpdateService";
import SnippetService from "@ext/markdown/elements/snippet/edit/components/Tab/SnippetService";
import Snippet from "@ext/markdown/elements/snippet/render/components/Snippet";
import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { ReactElement, useEffect, useMemo, useRef, useState } from "react";

const SnippetComponent = ({ node, editor, getPos }: NodeViewProps): ReactElement => {
	const [content, setContent] = useState(node.attrs.content);
	const [isHovered, setIsHovered] = useState(false);
	const hoverElementRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		SnippetUpdateService.addUpdateContent(node.attrs.id, setContent);
		return () => SnippetUpdateService.removeUpdateContent(node.attrs.id, setContent);
	}, []);

	const handleDelete = () => {
		const position = getPos();
		editor.commands.deleteRange({ from: position, to: position + node.nodeSize });
	};

	const handleEdit = () => {
		SnippetService.openSnippet({ id: node.attrs.id, title: node.attrs.title });
	};

	const contents = useMemo(() => Renderer(content, { components: getComponents() }), [content]);

	return (
		<NodeViewWrapper ref={hoverElementRef} as={"div"} draggable={true} data-drag-handle>
			<HoverableActions
				hoverElementRef={hoverElementRef}
				setIsHovered={setIsHovered}
				isHovered={isHovered}
				rightActions={<SnippetActions onClickDelete={handleDelete} onClickEdit={handleEdit} />}
			>
				<div>
					<Snippet id={node.attrs.id}>{contents}</Snippet>
				</div>
			</HoverableActions>
		</NodeViewWrapper>
	);
};

export default SnippetComponent;
