import DiffContent from "@components/Atoms/DiffContent";
import styled from "@emotion/styled";
import { DiffFile } from "../../../../VersionControl/model/Diff";
import { FileStatus } from "../../../../Watchers/model/FileStatus";

const SidebarArticleLink = styled(
	({
		filePath,
		type,
		className,
	}: {
		type?: FileStatus;
		className?: string;
	} & Pick<DiffFile, "filePath">) => {
		return (
			<div className={"sidebar-article-link " + className}>
				<div className="logic-path-change">
					<DiffContent
						changes={filePath.hunks ?? [{ value: filePath.path, type }]}
						unchangedColor={{ color: "var(--color-primary-secondary)" }}
						isCode={false}
						showDiff
					/>
				</div>
			</div>
		);
	},
)`
	.logic-path-change {
		font-size: 13px;
		font-weight: 300;
		word-break: break-all;
	}
`;

export default SidebarArticleLink;
