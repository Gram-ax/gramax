import { IconButton } from "@ui-kit/Button";
import { setAgentChatIsOpen } from "../store/AgentChatIsOpenStore";

const ChatToggleButton = () => (
	<IconButton
		icon="wand-sparkles"
		iconClassName="size-3.5"
		onClick={() => {
			setAgentChatIsOpen(true);
		}}
		size="xs"
		variant="ghost"
	/>
);

export default ChatToggleButton;
