import Icon from "@components/Atoms/Icon";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import Flag from "@ext/markdown/elements/inlineProperty/edit/components/inputs/Flag";
import PropertyArticle from "@ext/properties/components/Helpers/PropertyArticle";
import PropertyServiceProvider from "@ext/properties/components/PropertyService";
import getDisplayValue from "@ext/properties/logic/getDisplayValue";
import { Property, PropertyTypes } from "@ext/properties/models";

interface InlinePropertyProps {
	bind: string;
	selected: boolean;
	props: Map<string, Property>;
	onUpdate: (bind: string) => void;
	onChangeProperty: (name: string, value: string) => void;
	isEditable: boolean;
}

const TriggerWrapper = styled.span`
	display: inline-flex;
	align-items: center;
	vertical-align: top;
	line-height: 1.5em;
	gap: 0.25em;
	padding: 0 0.25em;
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
	bind: string;
	articleProp: Property;
	catalogProp: Property;
	isExists: boolean;
	onChangeProperty: (name: string, value: string | boolean) => void;
}

const EditableProperty = ({ bind, onChangeProperty, articleProp, catalogProp, isExists }: EditablePropertyProps) => {
	if (!catalogProp) return;
	const isFlag = catalogProp?.type === PropertyTypes.flag;

	const yesOrNo = isExists ? t("yes") : t("no");
	const displayValue = isFlag ? yesOrNo : getDisplayValue(catalogProp?.type, articleProp?.value) || bind;

	const trigger = (
		<TriggerWrapper data-focusable="true">
			{articleProp && catalogProp?.icon && <Icon code={catalogProp?.icon} />}
			{displayValue}
		</TriggerWrapper>
	);

	if (!articleProp) return trigger;

	const renderInput = () => {
		const resolvedCustomComponent = catalogProp.type === PropertyTypes.flag ? Flag : undefined;
		if (!resolvedCustomComponent) return undefined;
		return () => (
			<Flag
				id={catalogProp.name}
				onChange={(e) => onChangeProperty(catalogProp.name, e.target.checked)}
				preSubmit={onChangeProperty}
				value={isExists}
			/>
		);
	};

	return (
		<span>
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

const InlineProperty = ({ bind, props, isEditable, onChangeProperty, selected }: InlinePropertyProps) => {
	const { articleProperties } = PropertyServiceProvider.value;
	const catalogProp = props.get(bind);
	const articleProp = articleProperties?.find((p) => p?.name === bind) || catalogProp;

	if (isEditable) {
		const isExists = articleProperties.some((p) => p?.name === articleProp?.name);

		return (
			<EditableProperty
				articleProp={articleProp}
				bind={bind}
				catalogProp={catalogProp}
				isExists={isExists}
				onChangeProperty={onChangeProperty}
			/>
		);
	}

	return (
		<TriggerWrapper className={selected ? "selected" : ""} data-focusable="true">
			{articleProp && catalogProp?.icon && <Icon code={catalogProp?.icon} />}
			{bind || "???"}
		</TriggerWrapper>
	);
};

export default InlineProperty;
