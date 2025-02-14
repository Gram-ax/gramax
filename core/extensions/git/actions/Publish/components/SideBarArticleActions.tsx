import GoToArticle from "@components/Actions/GoToArticle";
import Checkbox from "@components/Atoms/Checkbox";
import Icon from "@components/Atoms/Icon";
import Sidebar from "@components/Layouts/Sidebar";
import { FileStatus } from "@ext/Watchers/model/FileStatus";
import { MouseEvent, useState } from "react";
import Discard from "../../Discard/Discard";
import SideBarResourceData from "../model/SideBarResourceData";
import DiffCounter from "./DiffCounter";
import SidebarArticleLink from "./SidebarArticleLink";
import type { DiffItem } from "@ext/VersionControl/model/Diff";

interface SideBarArticleActionsProps extends Pick<DiffItem, "filePath"> {
	checked: boolean;
	status: FileStatus;
	title: string;
	resources: SideBarResourceData[];
	onStartDiscard: (paths: string[]) => void;
	onEndDiscard: (paths: string[]) => void;
	onChangeCheckbox: (isChecked: boolean) => void;
	addedCounter: number;
	removedCounter: number;
	logicPath?: string;
	goToArticleOnClick?: (e: MouseEvent) => void;
}
const SideBarArticleActions = (props: SideBarArticleActionsProps) => {
	const { checked, status, title, resources, filePath, addedCounter, removedCounter, logicPath } = props;
	const { onStartDiscard, onEndDiscard, onChangeCheckbox, goToArticleOnClick } = props;
	const [hover, setHover] = useState(false);

	return (
		<div
			className="sidebar-article-actions"
			onMouseEnter={() => setHover(true)}
			onMouseLeave={() => setHover(false)}
		>
			<div style={{ padding: "1rem" }}>
				<Sidebar
					title={title ? title : "..."}
					leftActions={[
						<Checkbox
							key={0}
							checked={checked}
							onChange={(isChecked) => {
								onChangeCheckbox(isChecked);
							}}
						/>,
					]}
					rightActions={
						hover
							? [
									logicPath && status !== FileStatus.delete ? (
										<GoToArticle
											key={1}
											distance={5}
											trigger={
												<Icon
													code="external-link"
													style={{ fontSize: "13px", fontWeight: 300 }}
												/>
											}
											href={logicPath}
											onClick={goToArticleOnClick}
										/>
									) : null,
									<Discard
										key={0}
										paths={[
											filePath.path,
											filePath.oldPath,
											...resources.map((r) => r.data.filePath.path),
										].filter((x) => x)}
										onStartDiscard={onStartDiscard}
										onEndDiscard={onEndDiscard}
									/>,
							  ]
							: [<DiffCounter key={1} added={addedCounter} removed={removedCounter} />]
					}
				/>
				<SidebarArticleLink filePath={filePath} type={status} />
			</div>
		</div>
	);
};

export default SideBarArticleActions;
