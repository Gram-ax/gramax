import DiffContent from "@components/Atoms/DiffContent";
import Divider from "@components/Atoms/Divider";
import LeftNavViewContent, { ViewContent } from "@components/Layouts/LeftNavViewContent/LeftNavViewContent";
import Modal from "@components/Layouts/Modal";
import ModalLayoutLight from "@components/Layouts/ModalLayoutLight";
import Sidebar from "@components/Layouts/Sidebar";
import ModalToOpenService from "@core-ui/ContextServices/ModalToOpenService/ModalToOpenService";
import styled from "@emotion/styled";
import SidebarArticleLink from "@ext/git/actions/Publish/components/SidebarArticleLink";
import getSideBarData from "@ext/git/actions/Publish/logic/getSideBarData";
import SideBarData from "@ext/git/actions/Publish/model/SideBarData";
import DiffItem from "@ext/VersionControl/model/DiffItem";
import DiffResource from "@ext/VersionControl/model/DiffResource";
import { useMemo, useState } from "react";

const MergeRequestDiff = ({
	data,
	onOpen,
	onClose,
	className,
}: {
	data: {
		items: DiffItem[];
		resources: DiffResource[];
	};
	onOpen?: () => Promise<void> | void;
	onClose?: () => Promise<void> | void;
	className?: string;
}) => {
	const [isOpen, setisOpen] = useState(true);

	const sideBarData = useMemo(() => {
		if (!data) return null;
		const itemDiffs = getSideBarData(data?.items ?? [], true, false);
		const anyFileDiffs = getSideBarData(data?.resources ?? [], true, true);
		const currentSideBarData: SideBarData[] = [];

		if (itemDiffs.length && anyFileDiffs.length) {
			currentSideBarData.push(...[...itemDiffs, null, ...anyFileDiffs]);
		} else {
			if (itemDiffs.length) currentSideBarData.push(...itemDiffs);
			if (anyFileDiffs.length) currentSideBarData.push(...anyFileDiffs);
		}
		return currentSideBarData;
	}, [data]);

	const sideBarDataElements: ViewContent[] = (sideBarData ?? []).flatMap((x) => {
		if (!x) {
			return {
				leftSidebar: (
					<div className="left-sidebar-divider">
						<Divider />
					</div>
				),
				clickable: false,
			};
		}

		const item: ViewContent = {
			leftSidebar: (
				<div style={{ padding: "1rem" }}>
					<Sidebar title={x.data.title} />
					<SidebarArticleLink filePath={x.data.filePath} type={x.data.changeType} />
				</div>
			),
			content: (
				<div className={className}>
					<div className="diff-content">
						<DiffContent showDiff={true} changes={x.diff?.changes ?? []} />
					</div>
				</div>
			),
		};
		return item;
	});

	return (
		<Modal
			isOpen={isOpen}
			onOpen={() => {
				setisOpen(true);
				onOpen?.();
			}}
			onClose={() => {
				setisOpen(false);
				ModalToOpenService.resetValue();
				onClose?.();
			}}
			contentWidth="L"
		>
			<ModalLayoutLight>
				<LeftNavViewContent elements={sideBarDataElements} />
			</ModalLayoutLight>
		</Modal>
	);
};

export default styled(MergeRequestDiff)`
	.diff-content {
		padding: 20px;
	}
`;
