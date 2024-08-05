import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import { CSSProperties } from "react";
import Tooltip from "./Tooltip";

const TeamsEmailAnchorLayout = styled(
	({ email, userName, style }: { email: string; userName?: string; style?: CSSProperties }) => (
		<Tooltip content={t("open-in.teams")}>
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
	),
)``;

export default TeamsEmailAnchorLayout;
