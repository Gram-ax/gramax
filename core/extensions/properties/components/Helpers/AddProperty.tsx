import Icon from "@components/Atoms/Icon";
import PopupMenuLayout from "@components/Layouts/PopupMenuLayout";
import FetchService from "@core-ui/ApiServices/FetchService";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import t from "@ext/localization/locale/translate";
import CatalogEditProperty from "@ext/properties/components/Modals/CatalogEditProperty";
import PropertyItem from "@ext/properties/components/PropertyItem";
import { getInputComponent, getInputType, getPlaceholder, Property, PropertyValue } from "@ext/properties/models";
import { MouseEvent, useCallback, useRef, useState } from "react";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import combineProperties from "@ext/properties/logic/combineProperties";
import MimeTypes from "@core-ui/ApiServices/Types/MimeTypes";
import useWatch from "@core-ui/hooks/useWatch";
import ArticlePropsService from "@core-ui/ContextServices/ArticleProps";
import { Instance, Props } from "tippy.js";
import getCatalogEditProps from "@ext/catalog/actions/propsEditor/logic/getCatalogEditProps";

interface AddPropertyProps {
	trigger: JSX.Element;
	properties: Property[] | PropertyValue[];
	isReadOnly: boolean;
	catalogProperties: Map<string, Property>;
	onSubmit: (propertyName: string, value: string) => void;
	setProperties?: (properties: Property[] | PropertyValue[]) => void;
	canAdd?: boolean;
}

const AddProperty = (props: AddPropertyProps) => {
	const { trigger, canAdd = false, properties, isReadOnly, catalogProperties, onSubmit, setProperties } = props;
	const articleProps = ArticlePropsService.value;
	const catalogProps = CatalogPropsService.value;
	const apiUrlCreator = ApiUrlCreatorService.value;

	const instanceRef = useRef<Instance<Props>>(null);
	const [isOpen, setOpen] = useState<boolean>(false);
	const [data, setData] = useState<Property>(null);

	useWatch(() => {
		setOpen(false);
		setData(null);
	}, [articleProps.logicPath]);

	const saveCatalogProperties = useCallback(
		async (property: Property, isDelete: boolean = false, saveValue?: boolean) => {
			const newProps = getCatalogEditProps(catalogProps);
			const index = newProps.properties.findIndex((obj) => obj.name === property.name);
			if (index === -1) newProps.properties = [...newProps.properties, property];
			else {
				if (isDelete && !saveValue) {
					newProps.properties = newProps.properties.filter((_, propIndex) => propIndex !== index);
					const res = await FetchService.fetch(apiUrlCreator.removePropertyFromArticles(property.name));

					if (res.ok && canAdd)
						setProperties(combineProperties(await res.json(), Array.from(catalogProperties.values())));
				} else {
					const deletedValues = saveValue
						? ""
						: newProps.properties?.[index]?.values
								?.filter((value) => !property.values.includes(value))
								.toString();

					newProps.properties = [...newProps.properties];
					newProps.properties[index] = {
						...property,
					};

					if (deletedValues) {
						const res = await FetchService.fetch(
							apiUrlCreator.removePropertyFromArticles(property.name, deletedValues),
						);

						if (res.ok && canAdd)
							setProperties(combineProperties(await res.json(), Array.from(catalogProperties.values())));
					}
				}
			}

			FetchService.fetch(apiUrlCreator.updateCatalogProps(), JSON.stringify(newProps), MimeTypes.json);
			CatalogPropsService.value = { ...catalogProps, properties: newProps.properties };
		},
		[catalogProps, properties],
	);

	const toggleModal = useCallback(
		(id?: string) => {
			if (typeof id === "undefined") {
				setOpen(false);
				setData(null);
				return;
			}

			setData(catalogProperties.get(id));
			setOpen(true);
		},
		[catalogProperties, setData, setOpen],
	);

	const hideTippy = useCallback(
		(e: MouseEvent, id?: string) => {
			toggleModal(id);
			instanceRef.current?.hide();
			e.stopPropagation();
			e.preventDefault();
		},
		[toggleModal, instanceRef.current],
	);

	const handleClick = useCallback(
		(e: MouseEvent | KeyboardEvent, id: string, value: string) => {
			instanceRef.current?.hide();
			onSubmit(id, value);
		},
		[onSubmit],
	);

	const updateInput = useCallback(
		(id: string, instance: Instance<Props>) => {
			const value = instance.popper.getElementsByTagName("input")[0].value;

			if (value) {
				onSubmit(id, value);
				instance.popper.getElementsByTagName("input")[0].value = "";
			}
		},
		[onSubmit],
	);

	const onTippyMount = useCallback((instance: Instance<Props>) => {
		instanceRef.current = instance;
	}, []);

	return (
		<>
			{!isReadOnly && (
				<PopupMenuLayout
					isInline
					onTippyMount={onTippyMount}
					offset={[0, 10]}
					tooltipText={t("properties.name")}
					hideOnClick={false}
					trigger={trigger}
					appendTo={() => document.body}
				>
					<>
						{Array.from(catalogProperties.values()).map((property) => {
							const InputComponent = getInputComponent[property.type];
							return (
								<PropertyItem
									id={property.name}
									key={property.name}
									name={property.name}
									startIcon={property.icon}
									values={property.values}
									onClick={(e: MouseEvent, id, value) => handleClick(e, id, value)}
									closeOnSelection={false}
									rightActions={
										canAdd && (
											<Icon isAction code="pen" onClick={(e) => hideTippy(e, property.name)} />
										)
									}
									onHide={(instance) =>
										getInputType[property.type] && updateInput(property.name, instance)
									}
								>
									{InputComponent && (
										<InputComponent
											type={getInputType[property.type]}
											placeholder={t(getPlaceholder[property.type])}
											onKeyDown={(e) =>
												e.code === "Enter" &&
												handleClick(e, property.name, (e.target as HTMLInputElement).value)
											}
										/>
									)}
								</PropertyItem>
							);
						})}
					</>
					{catalogProperties.size > 0 && canAdd && <div className="divider" />}
					{canAdd && <PropertyItem id={null} name={t("create-new")} startIcon="plus" onClick={hideTippy} />}
				</PopupMenuLayout>
			)}
			{isOpen && !isReadOnly && canAdd && (
				<CatalogEditProperty
					data={data}
					closeModal={toggleModal}
					isOpen={isOpen}
					onSubmit={saveCatalogProperties}
				/>
			)}
		</>
	);
};

export default AddProperty;
