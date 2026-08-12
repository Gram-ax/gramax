import { TextSize } from "@components/Atoms/Button/Button";
import Notification from "@components/Atoms/Notification";
import Tooltip from "@components/Atoms/Tooltip";
import { LeftNavigationTab } from "@components/Layouts/StatusBar/Extensions/ArticleStatusBar/ArticleStatusBar";
import ButtonLink from "@components/Molecules/ButtonLink";
import NavigationTabsService from "./NavigationTabsService";

interface NotificationIconProps {
	isMacDesktop: boolean;
	iconCode: string;
	tooltipText?: string;
	count?: number;
	onCloseNotification?: () => void;
}

const NotificationIcon = (props: NotificationIconProps) => {
	const { isMacDesktop, onCloseNotification, count = 0, iconCode, tooltipText } = props;

	const onClose = () => {
		NavigationTabsService.setTop(LeftNavigationTab.None);
		onCloseNotification?.();
	};

	return (
		<div
			className={[
				"relative border border-secondary-border border-b-secondary-bg bg-secondary-bg",
				isMacDesktop ? "p-3" : "p-[13px] pb-[14px] mt-[1.45px]",
			].join(" ")}
			onClick={onClose}
		>
			<Tooltip content={tooltipText}>
				<div className="relative">
					<Notification
						size={10}
						style={{ color: "var(--color-tooltip-text)" }}
						wrapperStyle={{ background: "var(--color-tooltip-background)" }}
					>
						{count}
					</Notification>
					<ButtonLink iconCode={iconCode} textSize={TextSize.L} />
				</div>
			</Tooltip>
		</div>
	);
};

export default NotificationIcon;
