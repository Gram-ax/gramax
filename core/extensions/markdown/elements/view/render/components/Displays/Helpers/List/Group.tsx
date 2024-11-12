import { ReactNode } from "react";
import { ViewRenderData, ViewRenderGroup, Property as PropertyType, PropertyTypes } from "@ext/properties/models";
import Anchor from "@components/controls/Anchor";
import Property from "@ext/properties/components/Property";
import t from "@ext/localization/locale/translate";

const renderGroup = (group: ViewRenderGroup): ReactNode => {
	const listItems = group.articles.map((article: ViewRenderData, index) => (
		<li key={article.title + index}>
			<div>
				<Anchor href={article.linkPath} resourcePath={article.resourcePath}>
					{article.title || t("article.no-name")}
				</Anchor>
				<div className="chips">
					{article.otherProps.map((property: PropertyType) => (
						<Property
							key={property.name}
							type={property.type}
							icon={property.icon}
							propertyStyle={property.style}
							name={property.name}
							value={property.type !== PropertyTypes.flag ? property.value : property.name}
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
					<li key={subgroup.group?.[0]}>{renderGroup(subgroup)}</li>
				))}
			</>
		);

	return (
		<li>
			<div>{group.group}</div>
			{listItems.length > 0 && <ul>{listItems}</ul>}
			{group.subgroups?.length > 0 && (
				<ul>
					{group.subgroups.map((subgroup) => (
						<li key={subgroup.group?.[0]}>{renderGroup(subgroup)}</li>
					))}
				</ul>
			)}
		</li>
	);
};

export default renderGroup;
