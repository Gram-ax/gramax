import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import { CSSProperties } from "react";
import Tooltip from "./Tooltip";

const TeamsEmailAnchorLayout = styled(
	({ email, userName, style }: { email: string; userName?: string; style?: CSSProperties }) => (
		<Tooltip content={t("open-in.teams")}>
			<a
				data-for="teams-email-tooltip"
				data-tip
				href={`https://teams.microsoft.com/l/chat/0/0?users=${email}`}
				rel="noreferrer"
				style={style}
				target="_blank"
			>
				{userName ?? email}
			</a>
		</Tooltip>
	),
)``;

export default TeamsEmailAnchorLayout;
