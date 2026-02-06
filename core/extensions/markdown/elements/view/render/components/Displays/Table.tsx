import WidthWrapper from "@components/WidthWrapper/WidthWrapper";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import BlockCommentView from "@ext/markdown/elements/comment/edit/components/View/BlockCommentView";
import ColGroup from "@ext/markdown/elements/table/edit/components/Helpers/ColGroup";
import Group from "@ext/markdown/elements/view/render/components/Displays/Helpers/Table/Group";
import PropertyServiceProvider from "@ext/properties/components/PropertyService";
import { Property, PropertyTypes, ViewRenderGroup } from "@ext/properties/models";
import { useRef } from "react";

interface TableProps {
	content: ViewRenderGroup[];
	className?: string;
	groupby: string[];
	select: string[];
	commentId?: string;
}

const getWidth = (property: Property) => {
	if (property?.type === PropertyTypes.blockMd) return "20em";
	return "8em";
};

const Table = ({ content, className, groupby, select, commentId }: TableProps) => {
	const catalogName = useCatalogPropsStore((state) => state.data?.name);
	const { properties } = PropertyServiceProvider.value;
	const ref = useRef<HTMLTableElement>(null);
	return (
		<div className={className}>
			<WidthWrapper>
				<BlockCommentView commentId={commentId}>
					<table data-focusable="true" ref={ref}>
						<ColGroup tableRef={ref} />
						<tbody>
							<tr>
								{groupby?.map((name) => (
									<th data-colwidth="10em" key={name} scope="col">
										{name}
									</th>
								))}
								<th data-colwidth="10em" scope="col">
									{t("properties.article")}
								</th>
								{select?.map((name) => (
									<th data-colwidth={getWidth(properties.get(name))} key={name} scope="col">
										{name}
									</th>
								))}
							</tr>
							{content?.map((group) => (
								<Group
									catalogName={catalogName}
									catalogProperties={properties}
									group={group}
									key={group.group?.[0]}
									select={select}
								/>
							))}
						</tbody>
					</table>
				</BlockCommentView>
			</WidthWrapper>
		</div>
	);
};

export default styled(Table)`
	[data-focusable="true"] {
		outline-offset: -4px !important;
	}

	.block-comment-view {
		outline-offset: -2px;
	}

	table {
		border-radius: var(--radius-small);
	}

	td,
	tr {
		text-align: left;
		vertical-align: top !important;
		padding: 12px;
		word-break: break-word;
		white-space: normal;
	}

	th,
	td {
		max-width: 25vw !important;
	}

	.row {
		display: flex;
		align-items: center;
		gap: 0.5em;
	}

	.chips {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		word-wrap: break-word;
		gap: 0.5em;
		font-size: 12px;

		* {
			line-height: normal !important;
		}
	}
`;
