import styled from "@emotion/styled";
import { CSSProperties } from "react";
import useLocalize from "../../extensions/localization/useLocalize";
import Tooltip from "./Tooltip";

const TeamsEmailAnchorLayout = styled(
	({ email, userName, style }: { email: string; userName?: string; style?: CSSProperties }) => {
		const tooltipText = useLocalize("openInTeams");

		return (
			<Tooltip content={tooltipText}>
				<a
					style={style}
					data-tip
					data-for="teams-email-tooltip"
					target="_blank"
					href={`https://teams.microsoft.com/l/chat/0/0?users=${email}`}
					rel="noreferrer"
				>
					{userName ?? email}
				</a>
			</Tooltip>
		);
	},
)``;

export default TeamsEmailAnchorLayout;
