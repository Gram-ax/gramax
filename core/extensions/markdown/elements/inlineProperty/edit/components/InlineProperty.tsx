import Icon from "@components/Atoms/Icon";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import Flag from "@ext/markdown/elements/inlineProperty/edit/components/inputs/Flag";
import type { InlinePropertyOptions } from "@ext/markdown/elements/inlineProperty/edit/models/inlineProperty";
import PropertyArticle from "@ext/properties/components/Helpers/PropertyArticle";
import PropertyServiceProvider from "@ext/properties/components/PropertyService";
import getDisplayValue from "@ext/properties/logic/getDisplayValue";
import { type Property, PropertyTypes } from "@ext/properties/models";
import { useMemo } from "react";

interface InlinePropertyProps extends InlinePropertyOptions {
	bind: string;
	selected: boolean;
	props: Map<string, Property>;
	onUpdate: (bind: string) => void;
	onChangeProperty: (name: string, value: string) => void;
}

const TriggerWrapper = styled.span`
	display: inline-flex;
	align-items: center;
	vertical-align: top;
	line-height: 1.5em;
	gap: 0.25em;
	cursor: pointer;
	user-select: none;
	margin-top: 2px;
	border-bottom: 2px dashed var(--color-comment-bg);

	:hover {
		background-color: var(--color-comment-hover-bg);
		border-bottom: 2px dashed var(--color-comment-hover-bg);
	}

	&.selected {
		background-color: var(--color-comment-active-bg);
		border-bottom: 2px dashed var(--color-comment-active-bg);
	}
`;

interface EditablePropertyProps {
	value: string;
	articleProp: Property;
	catalogProp: Property;
	isExists: boolean;
	onChangeProperty: (id: string, value: string | boolean) => void;
}

const EditableProperty = ({ value, onChangeProperty, articleProp, catalogProp, isExists }: EditablePropertyProps) => {
	if (!catalogProp) return;

	const trigger = (
		<TriggerWrapper data-focusable="true">
			{articleProp && catalogProp?.icon && <Icon code={catalogProp?.icon} />}
			{value}
		</TriggerWrapper>
	);

	if (!articleProp) return trigger;

	const renderInput = () => {
		const resolvedCustomComponent = catalogProp.type === PropertyTypes.flag ? Flag : undefined;
		if (!resolvedCustomComponent) return;

		return () => <Flag id={catalogProp.id} preSubmit={onChangeProperty} value={isExists} />;
	};

	return (
		<span data-testid="inline-property">
			<PropertyArticle
				hideClear={catalogProp.type === PropertyTypes.flag}
				onSubmit={onChangeProperty}
				property={articleProp}
				renderInput={renderInput()}
				trigger={trigger}
			/>
		</span>
	);
};

const InlineProperty = ({ bind, props, canChangeProps, scope, onChangeProperty, selected }: InlinePropertyProps) => {
	const { articleProperties } = PropertyServiceProvider.value;
	const resolvedView = useCatalogPropsStore((state) => state.data?.resolvedView);
	const catalogProp = props.get(bind);
	const articleProp = useMemo(
		() => articleProperties?.find((p) => p?.id === bind) || catalogProp,
		[articleProperties, bind, catalogProp],
	);

	const isExists = useMemo(
		() => articleProperties.some((p) => p?.id === articleProp?.id),
		[articleProperties, articleProp],
	);

	const value = useMemo(() => {
		const isFlag = catalogProp?.type === PropertyTypes.flag;

		const yesOrNo = isExists ? t("yes") : t("no");
		const displayValue = isFlag
			? yesOrNo
			: getDisplayValue(
					catalogProp?.type,
					scope === "article" || !resolvedView
						? articleProp?.value
						: resolvedView.properties.find((p) => p.id === bind)?.value,
				);
		return displayValue || catalogProp?.name || bind || "???";
	}, [articleProp, catalogProp, isExists, scope, bind, resolvedView]);

	if (canChangeProps) {
		return (
			<EditableProperty
				articleProp={articleProp}
				catalogProp={catalogProp}
				isExists={isExists}
				onChangeProperty={onChangeProperty}
				value={value}
			/>
		);
	}

	return (
		<TriggerWrapper className={selected ? "selected" : ""} data-focusable="true">
			{articleProp && catalogProp?.icon && <Icon code={catalogProp?.icon} />}
			{value || catalogProp?.name || bind || "???"}
		</TriggerWrapper>
	);
};

export default InlineProperty;
