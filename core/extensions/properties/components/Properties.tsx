import FetchService from "@core-ui/ApiServices/FetchService";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import styled from "@emotion/styled";
import { Property } from "@ext/properties/models";
import { useCallback, useMemo, CSSProperties, Dispatch, SetStateAction } from "react";
import PropertyArticle from "@ext/properties/components/Helpers/PropertyArticle";
import combineProperties from "@ext/properties/logic/combineProperties";
import useWatch from "@core-ui/hooks/useWatch";
import PropertyComponent from "@ext/properties/components/Property";
import AddProperty from "@ext/properties/components/Helpers/AddProperty";
import Chip from "@components/Atoms/Chip";
import PropertyServiceProvider from "@ext/properties/components/PropertyService";
import { deleteProperty, updateProperty } from "@ext/properties/logic/changeProperty";

interface PropertiesProps {
	properties: Property[];
	setProperties: Dispatch<SetStateAction<Property[]>>;
	className?: string;
	style?: CSSProperties;
}

const Properties = ({ className, style, properties, setProperties }: PropertiesProps) => {
	const articleProps = ArticlePropsService.value;
	const catalogProperties = PropertyServiceProvider.value?.properties;
	const apiUrlCreator = ApiUrlCreatorService.value;

	useWatch(() => {
		if (catalogProperties?.size > 0)
			setProperties(combineProperties(properties, Array.from(catalogProperties.values())));
	}, [catalogProperties]);

	useWatch(() => {
		if (articleProps?.properties && catalogProperties?.size > 0)
			setProperties(combineProperties(articleProps.properties, Array.from(catalogProperties.values())));
	}, [articleProps?.properties]);

	const deleteHandler = useCallback(
		(id: string) => {
			setProperties((prevProps: Property[]) => {
				const newProps = deleteProperty(id, prevProps) as Property[];
				if (!newProps) return prevProps;

				FetchService.fetch(
					apiUrlCreator.updateItemProps(),
					JSON.stringify({ ...articleProps, properties: newProps }),
					MimeTypes.json,
				);

				return combineProperties(newProps, Array.from(catalogProperties.values()));
			});
		},
		[articleProps, properties, catalogProperties],
	);

	const updateHandler = useCallback(
		(id: string, value?: string) => {
			setProperties((prevProps: Property[]) => {
				const newProps = updateProperty(id, value, catalogProperties, prevProps);
				if (!newProps) return prevProps;

				FetchService.fetch(
					apiUrlCreator.updateItemProps(),
					JSON.stringify({ ...articleProps, properties: newProps }),
					MimeTypes.json,
				);

				return combineProperties(newProps, Array.from(catalogProperties.values()));
			});
		},
		[articleProps, properties, catalogProperties],
	);

	const onSubmit = useCallback(
		(id: string, value: string, isDelete?: boolean) => {
			if (isDelete) deleteHandler(id);
			else updateHandler(id, value);
		},
		[updateHandler, deleteHandler],
	);

	const articleRenderedProperties = useMemo(() => {
		return properties?.map((property) => (
			<PropertyArticle
				key={property.name}
				property={property}
				onSubmit={onSubmit}
				trigger={
					<PropertyComponent
						key={property.name}
						type={property.type}
						icon={property.icon}
						value={property.value?.length ? property.value : property.name}
						name={property.name}
						propertyStyle={property.style}
					/>
				}
			/>
		));
	}, [properties]);

	return (
		<div className={className} style={style}>
			{articleRenderedProperties}
			<AddProperty
				trigger={
					<Chip icon="list-plus" chipStyle="none" dataQa="qa-add-property" style={{ height: "2.25em" }} />
				}
				canAdd
				properties={properties}
				catalogProperties={catalogProperties}
				onSubmit={updateHandler}
				setProperties={setProperties}
			/>
		</div>
	);
};

export default styled(Properties)`
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 0.5em;
	font-size: 0.7em;

	@media print {
		[data-qa="qa-add-property"] {
			display: none;
		}
	}
`;
