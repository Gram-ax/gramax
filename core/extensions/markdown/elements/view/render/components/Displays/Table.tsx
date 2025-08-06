import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import TableComponent from "@ext/markdown/elements/table/render/component/Table";
import Group from "@ext/markdown/elements/view/render/components/Displays/Helpers/Table/Group";
import { Property, PropertyTypes, ViewRenderGroup } from "@ext/properties/models";
import { ClientCatalogProps } from "@core/SitePresenter/SitePresenter";
import PropertyServiceProvider from "@ext/properties/components/PropertyService";

interface TableProps {
	content: ViewRenderGroup[];
	className?: string;
	groupby: string[];
	select: string[];
	catalogProps: ClientCatalogProps;
}

const getWidth = (property: Property) => {
	if (property?.type === PropertyTypes.blockMd) return "20em";
	return "8em";
};

const Table = ({ content, className, groupby, select, catalogProps }: TableProps) => {
	const { properties } = PropertyServiceProvider.value;
	return (
		<div className={className}>
			<TableComponent>
				<tbody>
					<tr>
						{groupby?.map((name) => (
							<th key={name} scope="col" data-colwidth="10em">
								{name}
							</th>
						))}
						<th scope="col" data-colwidth="10em">
							{t("properties.article")}
						</th>
						{select?.map((name) => (
							<th key={name} scope="col" data-colwidth={getWidth(properties.get(name))}>
								{name}
							</th>
						))}
					</tr>
					{content?.map((group) => (
						<Group
							key={group.group?.[0]}
							group={group}
							select={select}
							catalogName={catalogProps.name}
							catalogProperties={properties}
						/>
					))}
				</tbody>
			</TableComponent>
		</div>
	);
};

export default styled(Table)`
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
