import { ArticlePropertyWrapper } from "@ext/properties/components/ArticlePropertyWrapper";
import PropertyComponent from "@ext/properties/components/Property";
import { Property, PropertyTypes } from "@ext/properties/models";
import { Fragment } from "react";

interface FilteredPropertyBlockProps {
	properties: Property[];
	catalogProperties: Map<string, Property>;
	togglePropertyValue: (name: string, value?: string) => void;
	clearFilteredProperty: (name: string) => void;
}

export const FilteredPropertyBlock = ({
	properties,
	catalogProperties,
	togglePropertyValue,
	clearFilteredProperty,
}: FilteredPropertyBlockProps) => {
	return (
		properties.length > 0 && (
			<>
				<div className="search-form-divider"></div>
				<div className="search-form-properties-block">
					<ArticlePropertyWrapper>
						{properties.map((prop, i) => {
							// TODO: Hack. Should go away when switch to FilterMenu
							const catalogProperty = catalogProperties.get(prop.name);
							const truePropType = catalogProperty?.type ?? prop.type;

							return (
								<Fragment key={i}>
									{prop.value?.length ? (
										prop.value.map((propValue, i) => (
											<Fragment key={i}>
												<PropertyComponent
													icon={prop.icon}
													key={prop.name}
													name={prop.name}
													onClear={() => togglePropertyValue(prop.name, propValue)}
													propertyStyle={prop.style}
													shouldShowValue={prop.type !== PropertyTypes.flag}
													style={{
														cursor: "default",
													}}
													type={prop.type}
													value={
														truePropType === PropertyTypes.flag
															? `${prop.name}: ${propValue}`
															: propValue
													}
												/>
											</Fragment>
										))
									) : (
										<PropertyComponent
											icon={prop.icon}
											key={prop.name}
											name={prop.name}
											onClear={() => clearFilteredProperty(prop.name)}
											propertyStyle={prop.style}
											shouldShowValue={prop.type !== PropertyTypes.flag}
											style={{
												cursor: "default",
											}}
											type={prop.type}
											value={prop.value?.length && prop.value[0].length ? prop.value : prop.name}
										/>
									)}
								</Fragment>
							);
						})}
					</ArticlePropertyWrapper>
				</div>
			</>
		)
	);
};
