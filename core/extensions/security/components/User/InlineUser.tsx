import Date from "@components/Atoms/Date";
import Icon from "@components/Atoms/Icon";
import Tooltip from "@components/Atoms/Tooltip";
import UserCircle from "@components/Atoms/UserCircle";
import styled from "@emotion/styled";

interface UserProps {
	name: string;
	mail?: string;
	date?: string;
	className?: string;
}

const InlineUser = ({ name, mail, date, className }: UserProps) => {
	return (
		<div className={className}>
			<span className="user-circle">
				<UserCircle name={name || "Unknown"} />
			</span>
			<Tooltip delay={[1000, 0]} content={mail} appendTo={() => document.body}>
				<span className="user-name">{name}</span>
			</Tooltip>
			{date && (
				<>
					<span className="dot-divider">
						<Icon code="dot" />
					</span>
					<Date date={date} tooltipDelay={[1000, 0]} tooltipAppendTo={() => document.body} />
				</>
			)}
		</div>
	);
};

export default styled(InlineUser)`
	display: flex;
	align-items: center;
	gap: 0.3rem;
`;
