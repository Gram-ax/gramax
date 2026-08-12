import NotificationIcon from "@components/Layouts/LeftNavigationTabs/NotificationIcon";
import t from "@ext/localization/locale/translate";
import AgentSkillService from "./AgentSkillService";

interface AgentNotificationIconProps {
	isMacDesktop: boolean;
}

const AgentNotificationIcon = ({ isMacDesktop }: AgentNotificationIconProps) => {
	const { skills } = AgentSkillService.value;

	const onClose = () => {
		AgentSkillService.closeItem();
		AgentSkillService.setItems([]);
	};

	return (
		<NotificationIcon
			count={skills.size}
			iconCode="square-chevron-right"
			isMacDesktop={isMacDesktop}
			onCloseNotification={onClose}
			tooltipText={t("agent.skills.name")}
		/>
	);
};

export default AgentNotificationIcon;
