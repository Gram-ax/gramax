import { classNames } from "@components/libs/classNames";
import styled from "@emotion/styled";
import { ReactNode } from "react";

interface SidebarProps {
	leftActions?: ReactNode[];
	rightActions?: ReactNode[];
	className?: string;
	title?: string;
	titleComponent?: ReactNode;
	disable?: boolean;
}

const Sidebar = (props: SidebarProps) => {
	const { title, leftActions, rightActions, className, titleComponent } = props;

	return (
		<div className={classNames("sidebar-article-element", {}, [className])}>
			<div className="article-title">
				{leftActions?.length > 0 && <div className="sidebar-left-actions actions">{leftActions}</div>}
				<div className="title" title={title}>
					{title}
				</div>
				{titleComponent && <span className="title-component">{titleComponent}</span>}
				{rightActions?.length > 0 && <div className="sidebar-right-actions actions">{rightActions}</div>}
			</div>
		</div>
	);
};

export default styled(Sidebar)`
	${(p) =>
		p.disable
			? `
	opacity: 0.4;
	pointer-events: none;
	`
			: ""}

	.article-title,
	.actions {
		display: flex;
	}

	.article-title {
		gap: 0.5rem;
		align-items: center;
	}

	.title {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		width: 100%;
	}

	.actions {
		gap: 0.5rem;
	}

	a {
		font-weight: 300;
		color: var(--color-primary-general);
		text-decoration: none;
	}

	a:hover {
		color: var(--color-primary);
	}
`;
