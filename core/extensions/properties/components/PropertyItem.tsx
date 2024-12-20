import Icon from "@components/Atoms/Icon";
import PopupMenuLayout from "@components/Layouts/PopupMenuLayout";
import ButtonLink from "@components/Molecules/ButtonLink";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import PropertyButton from "@ext/properties/components/PropertyButton";
import isSystemProperty from "@ext/properties/logic/isSystemProperty";
import { ReactNode, useRef, MouseEvent } from "react";
import { Instance, Props } from "tippy.js";

interface PropertyItemProps {
	name?: string;
	id?: string;
	value?: string[];
	values?: string[] | number[];
	startIcon?: string;
	endIcon?: string;
	onHide?: (instance: Instance<Props>) => void;
	onClick?: (e: MouseEvent, id: string, value?: string) => void;
	className?: string;
	hasNoneProperty?: boolean;
	hasAllProperty?: boolean;
	children?: ReactNode;
	canMany?: boolean;
	allowAddAll?: boolean;
	rightActions?: ReactNode;
	closeOnSelection?: boolean;
	invertChecked?: boolean;
}

const PropertyItem = (props: PropertyItemProps) => {
	const {
		id,
		name,
		values,
		startIcon,
		endIcon,
		onClick,
		className,
		hasNoneProperty,
		hasAllProperty,
		children,
		value,
		invertChecked = false,
		canMany = false,
		closeOnSelection,
		onHide,
		rightActions,
		allowAddAll = false,
	} = props;
	const ref = useRef<HTMLDivElement>(null);
	const valueLength = value?.length ?? 0;
	const maxValue = values?.length + 1;
	const isSystem = isSystemProperty(name);
	const translatedName = isSystem ? t(`properties.system.${name}.name`) : name;
	const translatedValue = isSystem ? values.map((val) => t(`properties.system.${name}.values.${val}`)) : values;

	return values || children ? (
		<PopupMenuLayout
			offset={[10, -5]}
			appendTo={() => ref.current}
			className="wrapper"
			onClose={(instance) => onHide?.(instance)}
			hideOnClick={closeOnSelection}
			placement="right-start"
			openTrigger="mouseenter focus"
			trigger={
				<div className={className} onClick={(e) => allowAddAll && onClick?.(e, id, "all")}>
					{startIcon && (
						<div className="icon-space">
							<Icon code={startIcon} />
						</div>
					)}
					<div className="name">
						<ButtonLink ref={ref} text={translatedName} />
					</div>
					{endIcon && <div className="icon-space icon-space-right">{<Icon code={endIcon} />}</div>}
					<div className="right">
						{rightActions}
						<Icon code="chevron-right" className="icon-size" />
					</div>
				</div>
			}
		>
			<>
				{hasAllProperty && (
					<PropertyButton
						canMany={canMany}
						name={t("properties.select-all")}
						checked={!valueLength}
						indeterminate={valueLength > 0 && valueLength !== maxValue}
						onClick={(e) => onClick?.(e, id, "all")}
					/>
				)}
				{hasNoneProperty && (
					<PropertyButton
						canMany={canMany}
						name={t("properties.empty")}
						checked={!invertChecked ? !value?.includes("none") : value?.includes("none")}
						onClick={(e) => onClick?.(e, id, "none")}
					/>
				)}
				{children}
				{!children &&
					values?.map((val, index) => (
						<PropertyButton
							key={val}
							canMany={canMany}
							name={translatedValue[index]}
							checked={!invertChecked ? !value?.includes(val) : value?.includes(val)}
							onClick={(e) => onClick?.(e, id, val)}
						/>
					))}
			</>
		</PopupMenuLayout>
	) : (
		<div className={className} onClick={(e) => onClick?.(e, id)}>
			{startIcon && (
				<div className="icon-space">
					<Icon code={startIcon} />
				</div>
			)}
			<div className="name">
				<ButtonLink text={translatedName} />
			</div>
			{endIcon && (
				<div className="icon-space icon-space-right">
					<Icon code={endIcon} />
				</div>
			)}
			{rightActions && (
				<div className="right">
					{rightActions}
					<div className="icon-space" />
				</div>
			)}
		</div>
	);
};

export default styled(PropertyItem)`
	display: flex;
	align-items: center;
	width: 100%;

	.icon-space {
		font-size: 0.9rem;
		margin-right: 0.65em;
		width: 0.5em;
		min-width: 0.5em;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		visibility: ${({ startIcon: icon }) => (icon ? "visible" : "hidden")};
	}

	.icon-space-right {
		margin-right: 0;
		margin-left: 0.65em;
		visibility: ${({ endIcon: icon }) => (icon ? "visible" : "hidden")};
	}

	.icon-size {
		font-size: 1.2em;
	}

	.right {
		display: flex;
		gap: 0.25em;
		margin-right: -6px;
		margin-left: ${({ endIcon }) => (endIcon ? "0" : "1.15em")};
	}

	.name {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
`;
