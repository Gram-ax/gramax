import Anchor from "@components/controls/Anchor";
import t from "@ext/localization/locale/translate";
import PropertyArticle from "@ext/properties/components/Helpers/PropertyArticle";
import Property from "@ext/properties/components/Property";
import { Property as PropertyType, PropertyTypes, ViewRenderData, ViewRenderGroup } from "@ext/properties/models";
import { Fragment, ReactNode } from "react";

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
				<Anchor href={article.linkPath} isPrint={isPrint} resourcePath={article.resourcePath}>
					{article.title || t("article.no-name")}
				</Anchor>
				<div className="chips">
					{article.otherProps.map((property: PropertyType) => (
						<PropertyArticle
							disabled={disabled}
							key={property.name}
							onSubmit={(propertyName, value, isDelete) =>
								onSubmit?.(article.itemPath, parentGroups, propertyName, value, isDelete)
							}
							property={property}
							trigger={
								<div>
									<Property
										icon={property.icon}
										key={property.name}
										name={property.name}
										propertyStyle={property.style}
										shouldShowValue={property.type !== PropertyTypes.flag}
										type={property.type}
										value={property.type !== PropertyTypes.flag ? property.value : property.name}
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
