import { TextSize } from "@components/Atoms/Button/Button";
import Notification from "@components/Atoms/Notification";
import Tooltip from "@components/Atoms/Tooltip";
import { LeftNavigationTab } from "@components/Layouts/StatusBar/Extensions/ArticleStatusBar/ArticleStatusBar";
import { classNames } from "@components/libs/classNames";
import ButtonLink from "@components/Molecules/ButtonLink";
import styled from "@emotion/styled";

interface NotificationIconProps {
	isMacDesktop: boolean;
	iconCode: string;
	tooltipText?: string;
	count?: number;
	className?: string;
	setCurrentTab: (tab: LeftNavigationTab) => void;
	onCloseNotification?: () => void;
}

const NotificationIcon = (props: NotificationIconProps) => {
	const { className, setCurrentTab, isMacDesktop, onCloseNotification, count = 0, iconCode, tooltipText } = props;

	const onClose = () => {
		setCurrentTab(LeftNavigationTab.None);
		onCloseNotification();
	};

	return (
		<div
			className={classNames(className, { "is-mac-desktop": isMacDesktop, "is-normal": !isMacDesktop })}
			onClick={onClose}
		>
			<Tooltip content={tooltipText}>
				<div className="notification-icon">
					<Notification
						size={10}
						wrapperStyle={{ background: "var(--color-tooltip-background)" }}
						style={{ color: "var(--color-tooltip-text)" }}
					>
						{count}
					</Notification>
					<ButtonLink iconCode={iconCode} textSize={TextSize.L} />
				</div>
			</Tooltip>
		</div>
	);
};

export default styled(NotificationIcon)`
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

	.notification-icon {
		position: relative;
	}
`;
