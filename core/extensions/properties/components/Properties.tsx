import PropertyItem from "@ext/properties/components/PropertyItem";
import Chip from "@components/Atoms/Chip";
import PopupMenuLayout from "@components/Layouts/PopupMenuLayout";
import FetchService from "@core-ui/ApiServices/FetchService";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import styled from "@emotion/styled";
import {
	getInputType,
	isHasValue,
	Property as PropertyType,
	PropertyTypes,
	PropertyValue,
	SystemProperties,
} from "@ext/properties/models";
import t from "@ext/localization/locale/translate";
import { useCallback, useMemo, useState, MouseEvent, KeyboardEvent, CSSProperties } from "react";
import Input from "@components/Atoms/Input";
import CatalogEditProperty from "@ext/properties/components/Modals/CatalogEditProperty";
import { ClientCatalogProps } from "@core/SitePresenter/SitePresenter";
import PageDataContextService from "@core-ui/ContextServices/PageDataContext";
import Icon from "@components/Atoms/Icon";
import PropertyArticle from "@ext/properties/components/Helpers/PropertyArticle";
import sortMapByName from "@ext/markdown/elements/view/render/logic/sortMap";

interface PropertiesProps {
	properties: PropertyValue[];
	className?: string;
	style?: CSSProperties;
}

const Properties = ({ className, style, properties }: PropertiesProps) => {
	const articleProps = ArticlePropsService.value;
	const catalogProps = CatalogPropsService.value;
	const apiUrlCreator = ApiUrlCreatorService.value;
	const pageData = PageDataContextService.value;
	const isReadOnly = pageData?.conf.isReadOnly;

	const [isOpen, setOpen] = useState<boolean>(false);
	const [data, setData] = useState<PropertyType>(null);

	const catalogProperties = useMemo(
		() =>
			new Map(
				catalogProps.properties.filter((prop) => !SystemProperties[prop.name]).map((prop) => [prop.name, prop]),
			),
		[catalogProps],
	);

	const articleProperties = useMemo(() => {
		return properties
			?.map((prop) => {
				const originalProp = catalogProperties.get(prop.name);

				if (!originalProp) return null;

				return {
					...originalProp,
					value: prop.value,
				};
			})
			.filter(Boolean);
	}, [properties, catalogProperties, articleProps]);

	const saveCatalogProperties = useCallback(
		async (property: PropertyType, isDelete: boolean = false, saveValue?: boolean) => {
			const newProps = { ...catalogProps };
			const index = newProps.properties.findIndex((obj) => obj.name === property.name);
			if (index === -1) newProps.properties = [...newProps.properties, property];
			else {
				if (isDelete && !saveValue) {
					newProps.properties = newProps.properties.filter((_, propIndex) => propIndex !== index);
					const res = await FetchService.fetch(apiUrlCreator.removePropertyFromArticles(property.name));

					if (res.ok) ArticlePropsService.set({ ...articleProps, properties: await res.json() });
				} else {
					const deletedValues = !saveValue
						? newProps.properties?.[index]?.values
								?.filter((value) => !property.values.includes(value))
								.toString()
						: "";

					newProps.properties = [...newProps.properties];
					newProps.properties[index] = {
						...property,
					};

					if (deletedValues) {
						const res = await FetchService.fetch(
							apiUrlCreator.removePropertyFromArticles(property.name, deletedValues),
						);

						if (res.ok) ArticlePropsService.set({ ...articleProps, properties: await res.json() });
					}
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
		(id: string) => {
			const property = catalogProperties.get(id);
			if (!property) return;

			const newProps = {
				...articleProps,
				properties: [...properties.filter((prop) => prop.name !== id)],
			};
			ArticlePropsService.set(newProps);
			FetchService.fetch(apiUrlCreator.updateItemProps(), JSON.stringify(newProps), MimeTypes.json);
		},
		[articleProps],
	);

	const updateProperty = useCallback(
		(id: string, value?: string) => {
			const property = catalogProperties.get(id);
			if (!property || (isHasValue[property.type] && value === undefined)) return;

			const newProps = { ...articleProps };
			const existedPropertyIndex = newProps.properties.findIndex((prop) => prop.name === property.name);

			const newValue = property.values && value ? value : value ?? null;

			if (existedPropertyIndex === -1) {
				newProps.properties = [
					...newProps.properties,
					{
						name: property.name,
						...(newValue !== null && { value: Array.isArray(newValue) ? newValue : [newValue] }),
					},
				];
			} else {
				const updatedProperties = [...newProps.properties];
				updatedProperties[existedPropertyIndex] = {
					...updatedProperties[existedPropertyIndex],
					...(newValue !== null && { value: Array.isArray(newValue) ? newValue : [newValue] }),
				};
				newProps.properties = updatedProperties;
			}

			const keys = Array.from(catalogProperties.keys());
			newProps.properties = sortMapByName(keys, newProps.properties as PropertyType[]);
			ArticlePropsService.set(newProps);
			FetchService.fetch(apiUrlCreator.updateItemProps(), JSON.stringify(newProps), MimeTypes.json);
		},
		[articleProperties, catalogProperties],
	);

	const toggleModal = (id?: string) => {
		if (typeof id === "undefined") {
			setOpen(false);
			setData(null);
			return;
		}

		setData(catalogProperties.get(id));
		setOpen(true);
	};

	const hideTippy = (e: MouseEvent, id?: string) => {
		toggleModal(id);
		const target = e.target as any;
		target?.parentNode?.parentNode?.parentNode?.offsetParent._tippy?.hide();
		e.stopPropagation();
		e.preventDefault();
	};

	const handleClick = (e: MouseEvent | KeyboardEvent, id: string, value: string) => {
		const target = e.target as any;
		target.offsetParent?.parentElement.offsetParent?._tippy?.hide();
		target.offsetParent?._tippy?.hide();
		updateProperty(id, value);
	};

	const onKeyDown = (e: KeyboardEvent, id: string) => {
		const target = e.target as HTMLInputElement;
		if (e.code === "Enter" && target.value.length) handleClick(e, id, target.value);
	};

	const updateNumeric = (id: string, instance: any) => {
		const value = instance.popper.getElementsByTagName("input")[0].value;

		if (value) {
			updateProperty(id, value);
			instance.popper.getElementsByTagName("input")[0].value = "";
		}
	};

	const articleRenderedProperties = useMemo(() => {
		return articleProperties.map((property) => (
			<PropertyArticle
				key={property.name}
				isReadOnly={isReadOnly}
				property={property}
				updateNumeric={updateNumeric}
				deleteProperty={deleteProperty}
				handleClick={handleClick}
				onKeyDown={onKeyDown}
			/>
		));
	}, [articleProperties]);

	return (
		<div className={className} style={style}>
			{articleRenderedProperties}
			{!isReadOnly && (
				<PopupMenuLayout
					isInline
					offset={[0, 10]}
					tooltipText={t("properties.name")}
					hideOnClick={false}
					trigger={
						<Chip icon="list-plus" chipStyle="none" dataQa="qa-add-property" style={{ height: "2.25em" }} />
					}
					appendTo={() => document.body}
				>
					<>
						{Array.from(catalogProperties.values()).map((property) => (
							<PropertyItem
								id={property.name}
								key={property.name}
								name={property.name}
								icon={property.icon}
								values={property.values}
								onClick={(e: MouseEvent, id, value) => handleClick(e, id, value)}
								closeOnSelection={false}
								rightActions={<Icon isAction code="pen" onClick={(e) => hideTippy(e, property.name)} />}
								onHide={(instance) =>
									property.type === PropertyTypes.numeric && updateNumeric(property.name, instance)
								}
							>
								{getInputType[property.type] && (
									<Input
										type={getInputType[property.type]}
										placeholder={t("enter-number")}
										onKeyDown={(e) =>
											e.code === "Enter" &&
											handleClick(e, property.name, (e.target as HTMLInputElement).value)
										}
									/>
								)}
							</PropertyItem>
						))}
					</>
					{catalogProperties.size > 0 && <div className="divider" />}
					<PropertyItem name={t("create-new")} icon="plus" onClick={(e) => hideTippy(e, null)} />
				</PopupMenuLayout>
			)}
			{isOpen && !isReadOnly && (
				<CatalogEditProperty
					data={data}
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
	font-size: 0.7em;
`;
