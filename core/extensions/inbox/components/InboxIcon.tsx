import { TextSize } from "@components/Atoms/Button/Button";
import Notification from "@components/Atoms/Notification";
import { LeftNavigationTab } from "@components/Layouts/StatusBar/Extensions/ArticleStatusBar/ArticleStatusBar";
import { classNames } from "@components/libs/classNames";
import ButtonLink from "@components/Molecules/ButtonLink";
import styled from "@emotion/styled";
import InboxService from "@ext/inbox/components/InboxService";

interface InboxIconProps {
	className?: string;
	setCurrentTab: (tab: LeftNavigationTab) => void;
	isMacDesktop: boolean;
}

const InboxIcon = ({ className, setCurrentTab, isMacDesktop }: InboxIconProps) => {
	const { notes } = InboxService.value;
	const onCloseInbox = () => {
		setCurrentTab(LeftNavigationTab.None);
		InboxService.removeAllNotes();
	};

	return (
		<div
			className={classNames(className, { "is-mac-desktop": isMacDesktop, "is-normal": !isMacDesktop })}
			onClick={onCloseInbox}
		>
			<div className="inbox-icon">
				<Notification
					size={10}
					wrapperStyle={{ background: "var(--color-tooltip-background)" }}
					style={{ color: "var(--color-tooltip-text)" }}
				>
					{notes.length}
				</Notification>
				<ButtonLink iconCode="inbox" textSize={TextSize.L} />
			</div>
		</div>
	);
};

export default styled(InboxIcon)`
	position: relative;
	border: 1px solid var(--color-merge-request-border);
	border-bottom: 1px solid transparent;
	background: var(--color-merge-request-bg);

	&.is-normal {
		padding: 13px;
		margin-top: 1.45px;
		padding-bottom: 14px;
	}

	&.is-mac-desktop {
		padding: 12px;
	}

	.inbox-icon {
		position: relative;
	}
`;
