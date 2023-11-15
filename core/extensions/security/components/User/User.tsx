import Date from "@components/Atoms/Date";
import UserCircle from "@components/Atoms/UserCircle";
import styled from "@emotion/styled";

const User = styled(
	({
		date,
		name,
		dateAdd,
		comment,
		actions,
		className,
	}: {
		date: string;
		name: string;
		mail?: string;
		dateAdd?: JSX.Element;
		comment?: JSX.Element;
		actions?: JSX.Element;
		className?: string;
	}) => {
		return (
			<div className={className}>
				<div className="comment-with-user">
					<div className="user-circle">
						<UserCircle name={name} />
					</div>
					<div className="comment-content">
						<div className="head">
							<div className="user-data">
								<div className="username">{name}</div>
								<Date date={date} className="date" />
								{dateAdd ? dateAdd : null}
							</div>
							{actions ? <div className="actions">{actions}</div> : null}
						</div>
						{comment ? <div className="editer">{comment}</div> : null}
					</div>
				</div>
			</div>
		);
	},
)`
	.comment-with-user {
		display: flex;
		flex-direction: row;
	}

	.user-circle {
		margin-right: 1rem;
	}

	.comment-content {
		width: 100%;
		overflow: hidden;
	}

	.head {
		width: 100%;
		display: flex;
		flex-direction: row;
		justify-content: space-between;
	}

	.user-data {
		display: flex;
		flex-wrap: wrap;
		overflow: hidden;
		height: fit-content;
		flex-direction: row;
		align-items: baseline;
		color: var(--color-input-active-text);
	}

	.username {
		${(p) => (p.mail ? "text-decoration: underline;" : null)}
		font-weight: 400;
		margin-right: 8px;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}

	.username a:hover {
		color: var(--color-primary) !important;
	}

	.date {
		color: var(--color-article-text);
		font-size: 12px;
		display: flex;
		align-items: flex-end;
	}

	.actions {
		color: var(--color-primary-general);
	}
`;

export default User;
