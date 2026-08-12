import t from "@ext/localization/locale/translate";
import { Dialog, DialogBody, DialogContent, DialogHeader, DialogTitle } from "@ui-kit/Dialog";
import { useActiveSessionId } from "../store/AgentStore";
import { SentContextSection } from "./SentContextSection";

type Props = {
	onClose: () => void;
};

export const AgentContextUsageModal = ({ onClose }: Props) => {
	const sessionId = useActiveSessionId();

	return (
		<Dialog
			onOpenChange={(open) => {
				if (!open) onClose();
			}}
			open={true}
		>
			<DialogContent size="M">
				<DialogHeader>
					<DialogTitle>{t("agent.usage.modal.title")}</DialogTitle>
				</DialogHeader>
				<DialogBody>
					<SentContextSection sessionId={sessionId} />
				</DialogBody>
			</DialogContent>
		</Dialog>
	);
};
