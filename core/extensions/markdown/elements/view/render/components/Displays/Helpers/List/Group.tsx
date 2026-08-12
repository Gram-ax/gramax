import t from "@ext/localization/locale/translate";
import { ViewListItem } from "@ext/markdown/elements/view/render/components/Displays/Helpers/List/ListItem";
import type { ViewRenderData, ViewRenderGroup } from "@ext/properties/models";
import { Fragment, type ReactNode } from "react";

const renderGroup = (
	group: ViewRenderGroup,
	disabled?: boolean,
	onSubmit?: (article: string, groups: string[], propertyName: string, value: string, isDelete?: boolean) => void,
	isPrint?: boolean,
	parentGroups: string[] = [],
): ReactNode => {
	const listItems = group.articles.map((article: ViewRenderData) => (
		<ViewListItem
			article={article}
			disabled={disabled}
			isPrint={isPrint}
			key={article.itemPath}
			onSubmit={onSubmit}
			parentGroups={parentGroups}
		/>
	));

	if (!group.group?.length)
		return (
			<>
				{listItems}
				{group.subgroups?.map((subgroup) => (
					<Fragment key={`${subgroup.group?.[0]}-list-item`}>
						{renderGroup(subgroup, disabled, onSubmit, isPrint, [...parentGroups, group.group?.[0]])}
					</Fragment>
				))}
			</>
		);

	return (
		<li>
			<div>{group.group?.[0] !== null ? group.group?.[0] : t("properties.empty")}</div>
			{listItems.length > 0 && <ul>{listItems}</ul>}
			{group.subgroups?.length > 0 && (
				<ul>
					{group.subgroups.map((subgroup) => (
						<Fragment key={`${subgroup.group?.[0]}-list-item`}>
							{renderGroup(subgroup, disabled, onSubmit, isPrint, [...parentGroups, group.group?.[0]])}
						</Fragment>
					))}
				</ul>
			)}
		</li>
	);
};

export default renderGroup;
