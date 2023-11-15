import styled from "@emotion/styled";

export type ListItem = {
	element: JSX.Element | string;
	labelField: string;
	disable?: boolean;
};

const Item = styled(
	({
		content,
		onClick,
		disable,
		className,
	}: {
		content: ListItem | string;
		onClick?: (value: ListItem | string, e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
		disable?: boolean;
		className?: string;
	}) => {
		return (
			<div
				data-qa="list-item"
				style={disable ? { pointerEvents: "none" } : null}
				onClick={(e) => (onClick ? onClick(content, e) : null)}
				className={"item " + className}
			>
				{typeof content === "string" ? content : content.element}
			</div>
		);
	},
)`
	display: flex;
	align-items: center;
	width: 100%;
	font-size: 14px;
	color: var(--color-article-heading-text);
	${(p) => (typeof p.content === "string" || typeof p.content.element === "string" ? "padding: 6px 12px;" : "")}

	:hover {
		cursor: pointer;
		background: var(--color-lev-sidebar-hover);
	}
`;

export default Item;
