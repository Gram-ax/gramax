import { Root as VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Sheet, SheetContent, SheetTitle } from "@ui-kit/Sheet";
import { useAgentChatIsOpen } from "../store/AgentChatIsOpenStore";
import AgentChatPanel from "./AgentChatPanel";

const ChatPanelOverlay = () => {
	const isOpen = useAgentChatIsOpen();

	return (
		<Sheet modal={false} open={isOpen}>
			<SheetContent
				onEscapeKeyDown={(e) => e.preventDefault()}
				onInteractOutside={(e) => e.preventDefault()}
				onOpenAutoFocus={(e) => e.preventDefault()}
				overlayType="transparent"
				showCloseButton={false}
				side="right"
			>
				<VisuallyHidden>
					<SheetTitle>Chat</SheetTitle>
				</VisuallyHidden>
				<AgentChatPanel />
			</SheetContent>
		</Sheet>
	);
};

export default ChatPanelOverlay;
