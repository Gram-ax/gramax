import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import TableComponent from "@ext/markdown/elements/table/render/component/Table";
import Group from "@ext/markdown/elements/view/render/components/Displays/Helpers/Table/Group";
import { ViewRenderGroup } from "@ext/properties/models";

interface TableProps {
	content: ViewRenderGroup[];
	className?: string;
	groupby: string[];
}

const Table = ({ content, className, groupby }: TableProps) => {
	return (
		<div className={className}>
			<TableComponent>
				<tbody data-focusable="true">
					<tr>
						{groupby.map((name) => (
							<th key={name} scope="col">
								{name}
							</th>
						))}
						<th scope="col">{t("properties.article")}</th>
					</tr>
					{content?.map((group) => (
						<Group key={group.group?.[0]} group={group} />
					))}
				</tbody>
			</TableComponent>
		</div>
	);
};

export default styled(Table)`
	tbody {
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
		max-width: max-content !important;
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
