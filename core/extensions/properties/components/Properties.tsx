import PropertyItem from "@ext/properties/components/PropertyItem";
import Chip from "@components/Atoms/Chip";
import PopupMenuLayout from "@components/Layouts/PopupMenuLayout";
import FetchService from "@core-ui/ApiServices/FetchService";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import { ClientCatalogProps } from "@core/SitePresenter/SitePresenter";
import styled from "@emotion/styled";
import CreateProps from "@ext/catalog/actions/propsEditor/components/CatalogEditProps";
import { Property, PropertyTypes } from "@ext/properties/models";
import t from "@ext/localization/locale/translate";
import { useCallback, useMemo, useState } from "react";
import { usePlatform } from "@core-ui/hooks/usePlatform";

const Properties = ({ className }: { className?: string }) => {
	const articleProps = ArticlePropsService.value;
	const catalogProps = CatalogPropsService.value;
	const apiUrlCreator = ApiUrlCreatorService.value;
	const { isNext } = usePlatform();

	const [isOpen, setOpen] = useState<boolean>(false);
	const [openID, setOpenID] = useState<number>(null);
	const articleProperties = useMemo(() => {
		return articleProps.properties
			?.map((prop) => {
				const originalProp = catalogProps.properties.find((catProp) => catProp.id === prop.id);

				if (!originalProp) return null;

				return {
					...originalProp,
					value: prop.value,
				};
			})
			.filter(Boolean);
	}, [articleProps?.properties, catalogProps?.properties]);

	const catalogProperties = catalogProps.properties.filter(
		(property) =>
			property.type !== PropertyTypes.counter &&
			property.type !== PropertyTypes["counter-link"] &&
			!articleProperties.find((val) => val.id === property.id),
	);

	const saveCatalogProperties = useCallback(
		async (value: Property, isDelete: boolean = false) => {
			const newProps = { ...catalogProps };
			const index = newProps.properties.findIndex((obj: Property) => obj.id === value.id);
			if (index === -1) newProps.properties = [...newProps.properties, value];
			else {
				if (isDelete) newProps.properties = newProps.properties.filter((_, propIndex) => propIndex !== index);
				else {
					newProps.properties = [...newProps.properties];
					newProps.properties[index] = {
						...value,
					};
				}
			}

			const result = await FetchService.fetch<ClientCatalogProps>(
				apiUrlCreator.updateCatalogProps(),
				JSON.stringify(newProps),
				MimeTypes.json,
			);

			if (!result.ok) return;
			const newCatalogProps = await result.json();
			CatalogPropsService.value = newCatalogProps;
		},
		[catalogProps],
	);

	const deleteProperty = useCallback(
		(index: number) => {
			const property = articleProperties[index];
			if (!property) return;

			const newProps = {
				...articleProps,
				properties: [...articleProps.properties.filter((_, propIndex) => propIndex !== index)],
			};
			ArticlePropsService.set(newProps);
			FetchService.fetch(apiUrlCreator.updateItemProps(), JSON.stringify(newProps), MimeTypes.json);
		},
		[articleProps],
	);

	const updateProperty = useCallback(
		(index: number, valID?: number, isExists: boolean = false) => {
			const property = isExists ? articleProperties[index] : catalogProperties[index];
			if (!property || (property.type === PropertyTypes.enum && valID === undefined)) return;

			const newProps = { ...articleProps };
			const existedPropertyIndex = newProps.properties.findIndex((prop) => prop.id === property.id);

			if (existedPropertyIndex === -1)
				newProps.properties = [
					...newProps.properties,
					{ id: property.id, value: valID !== undefined ? valID : null },
				];
			else {
				const updatedProperties = [...newProps.properties];
				updatedProperties[existedPropertyIndex] = {
					...updatedProperties[existedPropertyIndex],
					value: valID,
				};
				newProps.properties = updatedProperties;
			}

			ArticlePropsService.set(newProps);
			FetchService.fetch(apiUrlCreator.updateItemProps(), JSON.stringify(newProps), MimeTypes.json);
		},
		[articleProperties, catalogProperties],
	);

	const toggleModal = (id?: number) => {
		if (typeof id === "undefined") {
			setOpen(false);
			setOpenID(null);
			return;
		}

		setOpenID(id);
		setOpen(true);
	};

	return (
		<div className={className}>
			{articleProperties.map((property, index) => (
				<PopupMenuLayout
					key={property.name}
					isInline
					trigger={
						<Chip
							name={`${property.name}${
								property.value !== null
									? ": " + ((property.values && property.values[property.value]) || property.value)
									: ""
							}`}
							index={index}
							style={property.style}
						/>
					}
					appendTo={() => document.body}
				>
					{property.values && (
						<PropertyItem
							id={index}
							values={property.values}
							name={t("change")}
							icon="pencil"
							onClick={(index, valID) => updateProperty(index, valID, true)}
						/>
					)}
					<PropertyItem id={index} name={t("manage")} icon="wrench" onClick={toggleModal} />
					<PropertyItem id={index} name={t("delete")} icon="trash" onClick={deleteProperty} />
				</PopupMenuLayout>
			))}
			{!isNext && (
				<PopupMenuLayout
					isInline
					trigger={<Chip icon="list-plus" index={-1} style="none" />}
					appendTo={() => document.body}
				>
					<>
						{catalogProperties.map((property, index) => (
							<PropertyItem
								id={index}
								key={property.id}
								name={property.name}
								values={property.values}
								onClick={updateProperty}
							/>
						))}
					</>
					{catalogProperties.length > 0 && <div className="divider" />}
					<PropertyItem id={-1} name={t("add-new")} icon="plus" onClick={toggleModal} />
				</PopupMenuLayout>
			)}
			{isOpen && !isNext && (
				<CreateProps
					data={articleProperties[openID]}
					closeModal={toggleModal}
					isOpen={isOpen}
					onSubmit={saveCatalogProperties}
				/>
			)}
		</div>
	);
};

export default styled(Properties)`
	display: flex;
	align-items: center;
	gap: 0.5em;
	font-size: 12px;
`;
