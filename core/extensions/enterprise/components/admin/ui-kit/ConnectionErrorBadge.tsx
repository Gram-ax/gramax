import RichText from "@components/Atoms/RichText/RichText";
import type { AlertMessageState } from "@ext/enterprise/components/admin/hooks/useAlertMessage";
import { DialogErrorHeader } from "@ext/errorHandlers/client/components/DialogErrorHeader";
import t from "@ext/localization/locale/translate";
import { Badge } from "@ui-kit/Badge";
import { Dialog, DialogBody, DialogContent, DialogFooterTemplate } from "@ui-kit/Dialog";
import { useState } from "react";

interface ConnectionErrorBadgeProps {
	alert?: AlertMessageState;
}

export const ConnectionErrorBadge = ({ alert }: ConnectionErrorBadgeProps) => {
	const [isOpen, setIsOpen] = useState(false);

	if (!alert?.isShown) return null;

	return (
		<>
			<Badge
				className="cursor-pointer transition-colors hover:bg-status-error-bg-hover"
				onClick={() => setIsOpen(true)}
				startIcon="circle-alert"
				status="error"
			>
				{alert.badge ?? t("enterprise.admin.errors.causes.unknown")}
			</Badge>
			<Dialog onOpenChange={setIsOpen} open={isOpen}>
				<DialogContent className="font-sans font-normal" overlayType="dimmed">
					<DialogErrorHeader error={{ icon: "circle-x", isWarning: false, title: alert.title }} />
					<DialogBody>
						<RichText text={alert.message} />
					</DialogBody>
					<DialogFooterTemplate
						primaryButton={t("ok")}
						primaryButtonProps={{ onClick: () => setIsOpen(false) }}
					/>
				</DialogContent>
			</Dialog>
		</>
	);
};
