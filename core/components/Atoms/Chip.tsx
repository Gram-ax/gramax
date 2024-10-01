import Icon from "@components/Atoms/Icon";
import styled from "@emotion/styled";
import { ReactElement } from "react";

interface ChipProps {
	index: number;
	name?: string;
	icon?: string;
	style?: string;
	className?: string;
	onClick?: (index?: number) => void;
}

const Chip = ({ icon, name, className, onClick, index = -1 }: ChipProps): ReactElement => {
	return (
		<div className={className} onClick={() => onClick?.(index)}>
			{name}
			{icon && <Icon code={icon} />}
		</div>
	);
};

export default styled(Chip)`
	user-select: none;
	display: flex;
	align-items: center;
	gap: 6px;
	border-radius: var(--radius-medium);
	background: ${(p) => (!p.style ? "var(--color-code-bg)" : `var(--color-style-background-${p.style})`)};
	transition: all 100ms ease-in-out;
	color: var(--color-article-heading-text);
	padding: 0.2em 0.35em;
	cursor: pointer;

	:hover {
		${(p) => (p.style ? "filter: brightness(.9);" : "background: var(--color-code-bg-hover);")}
	}
`;
