import { classNames } from "@components/libs/classNames";
import styled from "@emotion/styled";
import { HTMLProps, ReactNode } from "react";

interface SidebarProps extends HTMLProps<HTMLDivElement> {
	leftActions?: ReactNode[];
	rightActions?: ReactNode[];
}

const Sidebar = styled((props: SidebarProps) => {
	const { title, leftActions, rightActions, className } = props;

	return (
		<div className={classNames("sidebar-article-element", {}, [className])}>
			<div className="article-title">
				{leftActions?.length > 0 && <div className="sidebar-left-actions actions">{leftActions}</div>}
				<div className="title" title={title}>
					{title}
				</div>
				{leftActions?.length > 0 && rightActions?.length > 0 && (
					<div className="sidebar-right-actions actions">{rightActions}</div>
				)}
			</div>
		</div>
	);
})`
	.article-title,
	.actions {
		display: flex;
	}

	.article-title {
		gap: 0.5rem;
	}

	.article-title {
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

export default Sidebar;
