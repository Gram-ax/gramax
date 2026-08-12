import Anchor from "@components/controls/Anchor";
import t from "@ext/localization/locale/translate";
import PropertyArticle from "@ext/properties/components/Helpers/PropertyArticle";
import Property from "@ext/properties/components/Property";
import { type Property as PropertyType, PropertyTypes, type ViewRenderData } from "@ext/properties/models";

interface ViewListItemProps {
	article: ViewRenderData;
	isPrint: boolean;
	disabled: boolean;
	onSubmit: (article: string, groups: string[], propertyName: string, value: string, isDelete?: boolean) => void;
	parentGroups: string[];
}

export const ViewListItem = ({ article, isPrint, disabled, onSubmit, parentGroups }: ViewListItemProps) => {
	return (
		<li>
			<div className="flex items-center gap-[0.5em] flex-wrap word-wrap break-word flex-row">
				<Anchor
					className="cursor-pointer"
					href={article.linkPath}
					isPrint={isPrint}
					resourcePath={article.resourcePath}
				>
					{article.title || t("article.no-name")}
				</Anchor>
				<div className="flex items-center gap-[0.5em] flex-wrap word-wrap break-word text-xs">
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
										className="leading-normal"
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
	);
};
