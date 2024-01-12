import styled from "@emotion/styled";
import { FileStatus } from "@ext/Watchers/model/FileStatus";

const SideBarResource = styled(
	({ title, className, changeType }: { title: string; changeType: FileStatus; className?: string }) => {
		return (
			<div className={"sidebar-resource-element " + className}>
				<div className="article-title">
					<span title={title} className={changeType == FileStatus.current ? "" : "highlight"}>
						{title}
					</span>
				</div>
			</div>
		);
	},
)`
	padding-left: 2rem !important;
	font-size: 14px;

	.highlight {
		color: ${(p) => (p.changeType == FileStatus.delete ? "var(--color-removed-text)" : "var(--color-added-text)")};
		background: ${(p) => (p.changeType == FileStatus.delete ? "var(--color-removed-bg)" : "var(--color-added-bg)")};
		border-radius: 5px;
	}

	.article-title {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
`;

export default SideBarResource;
