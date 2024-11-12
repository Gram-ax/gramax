import Icon from "@components/Atoms/Icon";
import { classNames } from "@components/libs/classNames";
import styled from "@emotion/styled";
import { CSSProperties, forwardRef, ReactNode } from "react";

interface ChipProps {
	index?: number;
	name?: ReactNode;
	icon?: string;
	chipStyle?: string;
	className?: string;
	onClick?: (index?: number) => void;
	disabled?: boolean;
	focused?: boolean;
	style?: CSSProperties;
	dataQa?: string;
}

const Chip = forwardRef<HTMLDivElement, ChipProps>((props, ref) => {
	const { icon, name, className, onClick, index = -1, disabled = false, style, dataQa, focused } = props;
	return (
		<div
			ref={ref}
			className={classNames(className, { disabled, focused })}
			onClick={() => onClick?.(index)}
			style={style}
			data-qa={dataQa}
		>
			{name}
			{icon && <Icon code={icon} />}
		</div>
	);
});

export default styled(Chip)`
	line-height: normal;
	user-select: none;
	display: flex;
	align-items: center;
	gap: 6px;
	cursor: pointer;
	border-radius: var(--radius-medium);
	background: ${(p) => (!p.chipStyle ? "var(--color-code-bg)" : `var(--color-style-background-${p.chipStyle})`)};
	color: var(--color-article-heading-text);
	padding: 0.35em 0.5em;
	${({ disabled, chipStyle }) =>
		!disabled &&
		`		
		&:hover {
			${chipStyle ? "filter: brightness(.9);" : "background: var(--color-code-bg-hover);"}
		}
	`}

	&.disabled {
		pointer-events: none;
		filter: brightness(0.5);
	}

	&.focused {
		${({ chipStyle }) => (chipStyle ? "filter: brightness(.9);" : "background: var(--color-code-bg-hover);")}
	}
`;
