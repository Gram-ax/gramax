import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import styled from "@emotion/styled";
import View from "@ext/markdown/elements/view/render/components/View";
import { Display } from "@ext/properties/models/display";
import { NodeViewProps } from "@tiptap/react";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import { MouseEvent, useCallback, useRef, useState } from "react";
import HoverableActions from "@components/controls/HoverController/HoverableActions";
import ViewActions from "@ext/markdown/elements/view/edit/components/Helpers/ViewActions";
import { NodeViewContextableWrapper } from "@ext/markdown/core/element/NodeViewContextableWrapper";

interface ViewComponentProps extends NodeViewProps {
	className?: string;
}

const ViewComponent = (props: ViewComponentProps) => {
	const { node, className, updateAttributes, editor } = props;
	const catalogProps = CatalogPropsService.value;
	const apiUrlCreator = ApiUrlCreatorService.value;
	const hoverElementRef = useRef<HTMLDivElement>(null);
	const [isHovered, setIsHovered] = useState(false);
	const isEditable = editor.isEditable;

	const updateDisplay = useCallback(
		(e: MouseEvent, display: Display) => {
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
		<NodeViewContextableWrapper ref={hoverElementRef} props={props}>
			<div className={className}>
				<HoverableActions
					hideOnClick={false}
					hoverElementRef={hoverElementRef}
					actionsOptions={{ comment: true }}
					isHovered={isHovered}
					setIsHovered={setIsHovered}
					rightActions={
						isEditable && (
							<ViewActions
								node={node}
								updateDisplay={updateDisplay}
								updateAttributes={updateAttributes}
								catalogProps={catalogProps}
							/>
						)
					}
				>
					<View
						defs={node.attrs.defs}
						orderby={node.attrs.orderby}
						groupby={node.attrs.groupby}
						select={node.attrs.select}
						display={node.attrs.display}
						disabled={false}
						updateArticle={updateArticle}
						commentId={node.attrs.comment?.id}
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
