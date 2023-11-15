import getTeamsHref from "@core-ui/getTeamsHref";
import { CSSProperties } from "react";
import useLocalize from "../../../extensions/localization/useLocalize";
import Tooltip from "../../Atoms/Tooltip";

const TeamsEmailAnchor = ({ email, text, style }: { email: string; text?: string; style?: CSSProperties }) => {
	const tooltipText = useLocalize("openInTeams");
	return (
		<Tooltip content={tooltipText}>
			<a style={style} target="_blank" href={getTeamsHref(email)} rel="noreferrer">
				{text ?? email}
			</a>
		</Tooltip>
	);
};

export default TeamsEmailAnchor;
