import Icon from "@components/Atoms/Icon";
import Tooltip from "@components/Atoms/Tooltip";
import { classNames } from "@components/libs/classNames";
import styled from "@emotion/styled";
import { forwardRef, memo, MouseEvent, useCallback } from "react";

interface ActionButtonProps {
	icon: string;
	selected?: boolean;
	tooltipText?: string;
	className?: string;
	disabled?: boolean;
	onClick?: (e: MouseEvent<HTMLDivElement>) => void;
	onMouseLeave?: () => void;
}

const ActionButton = forwardRef<HTMLDivElement, ActionButtonProps>((props, ref) => {
	const { icon, tooltipText, onClick, className, disabled, onMouseLeave, selected } = props;

	const preClick = useCallback(
		(e: MouseEvent<HTMLDivElement>) => {
			if (disabled) return;
			onClick?.(e);
		},
		[onClick, disabled],
	);

	return (
		<Tooltip content={tooltipText} delay={[500, 0]}>
			<div
				ref={ref}
				className={classNames(className, { selected })}
				onClick={preClick}
				onMouseLeave={onMouseLeave}
			>
				<Icon code={icon} />
			</div>
		</Tooltip>
	);
});

export default memo(styled(ActionButton)`
	display: flex;
	align-items: center;
	cursor: pointer;
	justify-content: center;
	color: var(--color-primary-general);
	padding: 7px 8px;

	&:hover {
		color: var(--color-primary);
	}
`);
