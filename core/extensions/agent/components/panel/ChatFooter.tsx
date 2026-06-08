import { ChatInput } from "./ChatInput";

type ChatFooterProps = {
	value: string;
	onChange: (v: string) => void;
	onSubmit: () => void;
	onCancel?: () => void;
	disabled?: boolean;
	sending?: boolean;
};

export function ChatFooter(props: ChatFooterProps) {
	return (
		<div className="shrink-0 pb-2 px-2">
			<ChatInput {...props} />
		</div>
	);
}
