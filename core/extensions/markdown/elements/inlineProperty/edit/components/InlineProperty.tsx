import styled from "@emotion/styled";
import ListLayout from "@components/List/ListLayout";
import { Property, PropertyTypes } from "@ext/properties/models";
import PropertyServiceProvider from "@ext/properties/components/PropertyService";
import Icon from "@components/Atoms/Icon";
import t from "@ext/localization/locale/translate";
import Flag from "@ext/markdown/elements/inlineProperty/edit/components/inputs/Flag";
import PropertyEditor from "@ext/markdown/elements/inlineProperty/edit/components/PropertyEditor";
import Tooltip from "@components/Atoms/Tooltip";

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
	line-height: 1.5em;
	gap: 0.25em;
	padding: 0 0.25em;
	cursor: pointer;
	user-select: none;
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

const ContentWrapper = styled.div`
	font-size: 0.8rem;
	background: var(--color-article-bg);
	box-shadow: var(--menu-tooltip-shadow);
	border-radius: var(--radius-medium);
	overflow: hidden;
`;

const InlineProperty = ({ bind, onUpdate, props, isEditable, onChangeProperty, selected }: InlinePropertyProps) => {
	const { articleProperties } = PropertyServiceProvider.value;
	const articleProp = articleProperties?.find((p) => p?.name === bind) || props.get(bind);

	if (isEditable) {
		const isFlag = articleProp?.type === PropertyTypes.flag;
		const isExists = articleProperties.some((p) => p?.name === articleProp?.name);

		const yesOrNo = isExists ? t("yes") : t("no");
		const displayValue = isFlag ? yesOrNo : articleProp?.value?.join(", ") || bind || "???";

		const trigger = (
			<TriggerWrapper data-focusable="true">
				{articleProp && <Icon code={articleProp?.icon} />}
				{displayValue}
			</TriggerWrapper>
		);

		if (articleProp) {
			const resolvedCustomComponent = articleProp.type === PropertyTypes.flag ? Flag : undefined;

			return (
				<PropertyEditor
					customComponent={resolvedCustomComponent}
					isInline
					id={articleProp.name}
					type={articleProp.type}
					values={articleProp.values}
					value={isFlag ? isExists : articleProp.value}
					onSubmit={onChangeProperty}
					trigger={trigger}
				/>
			);
		}
		return trigger;
	}

	return (
		<Tooltip
			visible={selected}
			interactive
			customStyle
			arrow={false}
			place="bottom-start"
			offset={[0, 5]}
			trigger="click"
			content={
				<ContentWrapper>
					<ListLayout
						onItemClick={onUpdate}
						item={bind}
						placeholder={t("template.select-property")}
						items={Array.from(props.keys())}
					/>
				</ContentWrapper>
			}
		>
			<TriggerWrapper data-focusable="true">
				{articleProp && <Icon code={articleProp?.icon} />}
				{bind || "???"}
			</TriggerWrapper>
		</Tooltip>
	);
};

export default InlineProperty;
