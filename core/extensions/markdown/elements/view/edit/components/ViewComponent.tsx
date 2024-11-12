import Icon from "@components/Atoms/Icon";
import { classNames } from "@components/libs/classNames";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import AddFilter from "@ext/markdown/elements/view/edit/components/Helpers/AddFilter";
import ViewButton from "@ext/markdown/elements/view/edit/components/Helpers/ViewButton";
import PropertyItem from "@ext/properties/components/PropertyItem";
import View from "@ext/markdown/elements/view/render/components/View";
import { PropertyValue } from "@ext/properties/models";
import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { Display } from "@ext/properties/models/displays";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import FetchService from "@core-ui/ApiServices/FetchService";

interface ViewComponentProps extends NodeViewProps {
	className?: string;
}

const ViewComponent = ({ node, className, updateAttributes, selected, editor }: ViewComponentProps) => {
	const catalogProps = CatalogPropsService.value;
	const apiUrlCreator = ApiUrlCreatorService.value;
	const isSelected = selected && editor.state.selection.from + 1 === editor.state.selection.to;
	const displayType = node.attrs.display;

	const updateDisplay = (display: Display) => {
		if (node.attrs.groupby.length > 1 && display === Display.Kanban)
			updateAttributes({ display, groupby: [node.attrs.groupby[0]] });
		else updateAttributes({ display });
	};

	const updateArticle = (articlePath: string, property: string, value: string) => {
		FetchService.fetch(apiUrlCreator.updateArticleProperty(articlePath, property, value));
	};

	return (
		<NodeViewWrapper>
			<div className={className}>
				<div className={classNames("view-filters", { "is-selected": isSelected })}>
					<AddFilter
						name={<Icon code="filter" />}
						tooltipText={t("properties.view.filter")}
						attributeName="defs"
						properties={node.attrs.defs as PropertyValue[]}
						updateAttributes={updateAttributes}
						catalogProps={catalogProps}
						closeOnSelection={false}
					/>
					<AddFilter
						name={<Icon code="arrow-down-a-z" />}
						tooltipText={t("properties.view.order-by")}
						attributeName="orderby"
						properties={node.attrs.orderby as PropertyValue[]}
						updateAttributes={updateAttributes}
						catalogProps={catalogProps}
						availableValues={false}
						oneValue={true}
						allowSystemProperties={false}
					/>
					<AddFilter
						name={<Icon code="list-tree" />}
						tooltipText={t("properties.view.group-by")}
						attributeName="groupby"
						properties={node.attrs.groupby as PropertyValue[]}
						updateAttributes={updateAttributes}
						catalogProps={catalogProps}
						availableValues={false}
						oneValue={node.attrs.display === Display.Kanban}
						allowSystemProperties={false}
					/>
					<AddFilter
						name={<Icon code="list-checks" />}
						tooltipText={t("properties.view.select")}
						attributeName="select"
						properties={node.attrs.select as PropertyValue[]}
						updateAttributes={updateAttributes}
						catalogProps={catalogProps}
						availableValues={false}
						allowSystemProperties={false}
					/>
					<ViewButton name={<Icon code="eye" />} tooltipText={t("properties.view.displays.name")}>
						<PropertyItem
							name={t("properties.view.displays.list")}
							icon={displayType === Display.List ? "check" : "list"}
							onClick={() => updateDisplay(Display.List)}
						/>
						<PropertyItem
							name={t("properties.view.displays.kanban")}
							icon={displayType === Display.Kanban ? "check" : "square-kanban"}
							onClick={() => updateDisplay(Display.Kanban)}
						/>
						<PropertyItem
							name={t("properties.view.displays.table")}
							icon={displayType === Display.Table ? "check" : "table"}
							onClick={() => updateDisplay(Display.Table)}
						/>
					</ViewButton>
				</div>
				<View
					defs={node.attrs.defs}
					orderby={node.attrs.orderby}
					groupby={node.attrs.groupby}
					select={node.attrs.select}
					display={node.attrs.display}
					updateArticle={updateArticle}
					disabled={false}
				/>
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

	.is-selected {
		display: flex !important;
	}

	.view-filters {
		position: absolute;
		top: -2em;
		right: 0;
		z-index: 10;
		display: none;
		font-size: 14px;
		word-wrap: break-word;
		flex-direction: row;
		flex-wrap: wrap;
		gap: 0.5em;
	}

	.view-content {
		width: 100%;
	}

	.error-message {
		width: 100%;
		border-radius: var(--radius-medium);
		text-align: center;
	}
`;
