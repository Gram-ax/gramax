import { TooltipIconButton } from "@components/Atoms/TooltipIconButton";
import t from "@ext/localization/locale/translate";
import { setAgentChatIsOpen } from "../store/AgentChatIsOpenStore";

const ChatToggleButton = () => (
	<TooltipIconButton
		className="text-color-primary-general"
		icon="wand-sparkles"
		iconClassName="size-3.5"
		onClick={() => {
			setAgentChatIsOpen(true);
		}}
		size="xs"
		tooltip={t("agent.tooltips.toggle-chat")}
		variant="text"
	/>
);

export default ChatToggleButton;
