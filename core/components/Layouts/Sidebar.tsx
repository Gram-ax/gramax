import styled from "@emotion/styled";

const Sidebar = styled(
	({
		title,
		leftActions,
		rightActions,
		className,
	}: {
		title: string;
		leftActions?: React.ReactNode[];
		rightActions?: React.ReactNode[];
		className?: string;
	}) => {
		return (
			<div className={"sidebar-article-element " + className}>
				<div className="article-title">
					{leftActions && leftActions.length ? (
						<div className="sidebar-left-actions actions">{leftActions}</div>
					) : null}
					<div className="title" title={title}>
						{title}
					</div>
					{rightActions && rightActions.length ? (
						<div className="sidebar-right-actions actions">{rightActions}</div>
					) : null}
				</div>
			</div>
		);
	},
)`
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
