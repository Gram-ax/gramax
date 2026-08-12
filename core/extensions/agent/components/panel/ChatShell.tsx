import { ChatSessionError } from "../message/ChatSessionError";
import { MessageList } from "../message/MessageList";
import { ChatFooter } from "./ChatFooter";
import { ChatHeader } from "./ChatHeader";

export const ChatShell = () => {
	return (
		<div className="flex h-full w-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-sidebar-bg">
			<ChatHeader />

			<ChatSessionError />

			<MessageList />

			<ChatFooter />
		</div>
	);
};
