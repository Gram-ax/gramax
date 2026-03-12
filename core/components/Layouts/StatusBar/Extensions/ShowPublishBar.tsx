import Icon from "@components/Atoms/Icon";
import NavigationTabsService from "@components/Layouts/LeftNavigationTabs/NavigationTabsService";
import { LeftNavigationTab } from "@components/Layouts/StatusBar/Extensions/ArticleStatusBar/ArticleStatusBar";
import StatusBarWrapper from "@components/Layouts/StatusBar/StatusBarWrapper";
import GitIndexService from "@core-ui/ContextServices/GitIndexService";
import SidebarsIsOpenService from "@core-ui/ContextServices/Sidebars/SidebarsIsOpenContext";
import useWatch from "@core-ui/hooks/useWatch";
import styled from "@emotion/styled";
import type { MergeRequestStatus } from "@ext/git/core/GitMergeRequest/components/Elements/Status";
import t from "@ext/localization/locale/translate";
import { useEffect, useRef, useState } from "react";

const Counter = styled.span`
	font-size: 10px;
	display: flex;
	align-items: center;
	height: 100%;

	i {
		font-size: 8px;
	}
`;

interface ShowPublishBarProps {
	onClick: () => void;
	isShow: boolean;
	mergeRequestStatus: MergeRequestStatus;
}

const TOOLTIP_DELAY = 5000;
const TOOLTIP_WITH_CLOSE_ANIMATION_DELAY = TOOLTIP_DELAY + 1000;

const ShowPublishBar = (props: ShowPublishBarProps) => {
	const { isShow, mergeRequestStatus, onClick } = props;

	const leftNavIsOpen = SidebarsIsOpenService.value.left;
	const isMergeRequestTabOpened = NavigationTabsService.value.bottomTab === LeftNavigationTab.MergeRequest;

	const overview = GitIndexService.getOverview();
	const total = overview.added + overview.deleted + overview.modified;

	const initiationChange = useRef(true);
	const mrTooltipHasBeenShown = useRef(false);

	const tooltipTimeout = useRef<NodeJS.Timeout | null>(null);
	const tooltipTextTimeout = useRef<NodeJS.Timeout | null>(null);

	const [showMrStatusTooltip, setShowMrStatusTooltip] = useState<true | undefined>(undefined);
	const [showMrStatusTooltipText, setShowMrStatusTooltipText] = useState(false);

	useWatch(() => {
		if (isMergeRequestTabOpened) {
			mrTooltipHasBeenShown.current = false;
		} else {
			if (!tooltipTextTimeout.current || !tooltipTimeout.current) return;
			setShowMrStatusTooltip(undefined);
			setShowMrStatusTooltipText(false);
			clearTimeout(tooltipTimeout.current);
			clearTimeout(tooltipTextTimeout.current);
		}
	}, [isMergeRequestTabOpened]);

	useEffect(() => {
		if (!mergeRequestStatus) return;
		if (initiationChange.current) {
			initiationChange.current = false;
			return;
		}

		if (mrTooltipHasBeenShown.current) return;
		mrTooltipHasBeenShown.current = true;

		setShowMrStatusTooltip(true);
		setShowMrStatusTooltipText(true);

		tooltipTimeout.current = setTimeout(() => setShowMrStatusTooltip(undefined), TOOLTIP_DELAY);
		tooltipTextTimeout.current = setTimeout(
			() => setShowMrStatusTooltipText(false),
			TOOLTIP_WITH_CLOSE_ANIMATION_DELAY,
		);
	}, [mergeRequestStatus]);

	return (
		<StatusBarWrapper
			dataQa="qa-publish-trigger"
			iconCode="custom-cloud-up"
			iconStyle={{ fill: isShow ? "var(--color-primary)" : "white" }}
			isShow={isShow}
			onClick={() => {
				onClick();
				if (!leftNavIsOpen) SidebarsIsOpenService.value = { left: true };
			}}
			showTooltip={showMrStatusTooltip}
			tooltipText={
				showMrStatusTooltipText ? t("git.merge-requests.approval.publish-tooltip") : t("publish-changes")
			}
		>
			{total > 0 && (
				<Counter>
					{total}
					<Icon code="move-up" strokeWidth="2" viewBox="2 0 20 20"></Icon>
				</Counter>
			)}
		</StatusBarWrapper>
	);
};

export default ShowPublishBar;
