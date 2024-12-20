import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import styled from "@emotion/styled";
import View from "@ext/markdown/elements/view/render/components/View";
import { Display } from "@ext/properties/models/displays";
import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";
import { MouseEvent, useCallback, useRef, useState } from "react";
import HoverableActions from "@components/controls/HoverController/HoverableActions";
import ViewActions from "@ext/markdown/elements/view/edit/components/Helpers/ViewActions";

interface ViewComponentProps extends NodeViewProps {
	className?: string;
}

const ViewComponent = ({ node, className, updateAttributes, editor, getPos }: ViewComponentProps) => {
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
		<NodeViewWrapper ref={hoverElementRef}>
			<div className={className}>
				<HoverableActions
					hoverElementRef={hoverElementRef}
					isHovered={isHovered}
					setIsHovered={setIsHovered}
					rightActions={
						isEditable && (
							<ViewActions
								editor={editor}
								getPos={getPos}
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
					/>
				</HoverableActions>
			</div>
		</NodeViewWrapper>
	);
};

export default styled(ViewComponent)`
	position: relative;
	display: flex;
	flex-direction: column;
	border-radius: var(--radius-medium);
	user-select: none;

	*[data-focusable] {
		padding: 8px;
	}

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
