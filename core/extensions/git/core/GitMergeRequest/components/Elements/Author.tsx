import Tooltip from "@components/Atoms/Tooltip";
import UserCircle from "@components/Atoms/UserCircle";
import styled from "@emotion/styled";
import { Accent } from "@ext/git/core/GitMergeRequest/components/Elements";
import type { Signature } from "@ext/git/core/model/Signature";
import t from "@ext/localization/locale/translate";
import VersionControlCommentCount from "@ext/markdown/elements/comment/edit/components/CommentCount";

const Comments = styled(VersionControlCommentCount)`
	margin-left: 0;
	padding-top: 0.12em;
	font-size: 14px;
`;

const Avatar = styled(UserCircle)`
	min-width: 2.4em;
	font-size: 0.65em;
`;

const Inline = styled.span`
	display: flex;
	align-items: center;
	gap: 0.33em;
	max-width: 100%;
	overflow: hidden;
`;

const Author = ({ author, comments, you }: { author: Signature; comments?: number; you?: boolean }) => {
	if (!author) return "Invalid author";

	return (
		<Inline>
			<Tooltip content={author.email || "unknown"} interactive>
				<Inline>
					<Avatar name={author.name || author.email || "Unknown"} />
					<Accent bold>{author.name || author.email || "Unknown"}</Accent>
					{you && <span>({t("git.merge-requests.you")})</span>}
				</Inline>
			</Tooltip>
			<Comments count={comments} />
		</Inline>
	);
};

export default Author;
