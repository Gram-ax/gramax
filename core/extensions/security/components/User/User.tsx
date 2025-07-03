import Date from "@components/Atoms/Date";
import Tooltip from "@components/Atoms/Tooltip";
import UserCircle from "@components/Atoms/UserCircle";
import { DateType } from "@core-ui/utils/dateUtils";
import styled from "@emotion/styled";

interface UserProps {
	date: DateType;
	name: string;
	mail?: string;
	dateAdd?: JSX.Element;
	comment?: JSX.Element;
	actions?: JSX.Element;
	tooltipDelay?: number;
	className?: string;
}

const UserUnstyled = (props: UserProps) => {
	const { date, name, mail, dateAdd, comment, actions, className, tooltipDelay } = props;
	return (
		<div className={className}>
			<div className="comment-with-user">
				<div className="user-circle">
					<UserCircle name={name} />
				</div>
				<div className="comment-content">
					<div className="head">
						<div className="user-data">
							<Tooltip content={mail} interactive delay={tooltipDelay}>
								<div className="username">{name}</div>
							</Tooltip>
							<div className="date-container">
								<Date date={date} className="date" tooltipDelay={tooltipDelay} />
								{dateAdd ? dateAdd : null}
							</div>
						</div>
						{actions ? <div className="actions">{actions}</div> : null}
					</div>
					{comment ? <div className="editer">{comment}</div> : null}
				</div>
			</div>
		</div>
	);
};

const User = styled(UserUnstyled)`
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
		font-size: 0.85em;
		display: flex;
		align-items: flex-end;
	}

	.actions {
		color: var(--color-primary-general);
	}
`;

export default User;
