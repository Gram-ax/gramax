import HoverableActions from "@components/controls/HoverController/HoverableActions";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import styled from "@emotion/styled";
import { NodeViewContextableWrapper } from "@ext/markdown/core/element/NodeViewContextableWrapper";
import ViewActions from "@ext/markdown/elements/view/edit/components/Helpers/ViewActions";
import View from "@ext/markdown/elements/view/render/components/View";
import { Display } from "@ext/properties/models/display";
import { NodeViewProps } from "@tiptap/react";
import { useCallback, useRef, useState } from "react";

interface ViewComponentProps extends NodeViewProps {
	className?: string;
}

const ViewComponent = (props: ViewComponentProps) => {
	const { node, className, updateAttributes, editor } = props;
	const apiUrlCreator = ApiUrlCreatorService.value;
	const hoverElementRef = useRef<HTMLDivElement>(null);
	const [isHovered, setIsHovered] = useState(false);
	const isEditable = editor.isEditable;

	const updateDisplay = useCallback(
		(display: Display) => {
			if (node.attrs.groupby.length > 1 && display === Display.Kanban)
				updateAttributes({ display, groupby: [node.attrs.groupby[0]] });
			else updateAttributes({ display });
		},
		[node.attrs.groupby],
	);

	const updateArticle = useCallback(
		(articlePath: string, property: string, value: string, isDelete?: boolean) => {
			FetchService.fetch(apiUrlCreator.updateArticleProperty(articlePath, property, value, isDelete?.toString()));
		},
		[apiUrlCreator],
	);

	return (
		<NodeViewContextableWrapper data-drag-handle props={props} ref={hoverElementRef}>
			<div className={className}>
				<HoverableActions
					actionsOptions={{ comment: true }}
					hideOnClick={false}
					hoverElementRef={hoverElementRef}
					isHovered={isHovered}
					rightActions={
						isEditable && (
							<ViewActions
								node={node}
								updateAttributes={updateAttributes}
								updateDisplay={updateDisplay}
							/>
						)
					}
					setIsHovered={setIsHovered}
				>
					<View
						commentId={node.attrs.comment?.id}
						defs={node.attrs.defs}
						disabled={false}
						display={node.attrs.display}
						groupby={node.attrs.groupby}
						orderby={node.attrs.orderby}
						select={node.attrs.select}
						updateArticle={updateArticle}
					/>
				</HoverableActions>
			</div>
		</NodeViewContextableWrapper>
	);
};

export default styled(ViewComponent)`
	position: relative;
	display: flex;
	flex-direction: column;
	border-radius: var(--radius-medium);
	user-select: none;

	.view-filter-row {
		display: flex;
		flex-direction: row;
		word-wrap: break-word;
		flex-wrap: wrap;
		gap: 0.5em;
	}

	.error-message {
		width: 100%;
		border-radius: var(--radius-medium);
		text-align: center;
	}
`;
