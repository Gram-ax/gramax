import getTeamsHref from "@core-ui/getTeamsHref";
import t from "@ext/localization/locale/translate";
import { CSSProperties } from "react";
import Tooltip from "../../Atoms/Tooltip";

const TeamsEmailAnchor = ({ email, text, style }: { email: string; text?: string; style?: CSSProperties }) => {
	return (
		<Tooltip content={t("open-in.teams")}>
			<a href={getTeamsHref(email)} rel="noreferrer" style={style} target="_blank">
				{text ?? email}
			</a>
		</Tooltip>
	);
};

export default TeamsEmailAnchor;
