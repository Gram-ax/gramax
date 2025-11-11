import { Fragment, ReactNode } from "react";
import { ViewRenderData, ViewRenderGroup, Property as PropertyType, PropertyTypes } from "@ext/properties/models";
import Anchor from "@components/controls/Anchor";
import Property from "@ext/properties/components/Property";
import t from "@ext/localization/locale/translate";
import PropertyArticle from "@ext/properties/components/Helpers/PropertyArticle";

const renderGroup = (
	group: ViewRenderGroup,
	disabled?: boolean,
	onSubmit?: (article: string, groups: string[], propertyName: string, value: string, isDelete?: boolean) => void,
	isPrint?: boolean,
	parentGroups: string[] = [],
): ReactNode => {
	const listItems = group.articles.map((article: ViewRenderData) => (
		<li key={article.itemPath}>
			<div>
				<Anchor href={article.linkPath} resourcePath={article.resourcePath} isPrint={isPrint}>
					{article.title || t("article.no-name")}
				</Anchor>
				<div className="chips">
					{article.otherProps.map((property: PropertyType) => (
						<PropertyArticle
							onSubmit={(propertyName, value, isDelete) =>
								onSubmit?.(article.itemPath, parentGroups, propertyName, value, isDelete)
							}
							disabled={disabled}
							key={property.name}
							property={property}
							trigger={
								<div>
									<Property
										key={property.name}
										type={property.type}
										icon={property.icon}
										propertyStyle={property.style}
										name={property.name}
										value={property.type !== PropertyTypes.flag ? property.value : property.name}
										shouldShowValue={property.type !== PropertyTypes.flag}
									/>
								</div>
							}
						/>
					))}
				</div>
			</div>
		</li>
	));

	if (!group.group || !group.group.length)
		return (
			<>
				{listItems}
				{group.subgroups?.map((subgroup) => (
					<Fragment key={subgroup.group?.[0]}>
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
						<Fragment key={subgroup.group?.[0]}>
							{renderGroup(subgroup, disabled, onSubmit, isPrint, [...parentGroups, group.group?.[0]])}
						</Fragment>
					))}
				</ul>
			)}
		</li>
	);
};

export default renderGroup;
