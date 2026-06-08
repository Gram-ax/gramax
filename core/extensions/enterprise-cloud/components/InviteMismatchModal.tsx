import t from "@ext/localization/locale/translate";
import { Button } from "@ui-kit/Button";
import {
	Dialog,
	DialogBody,
	DialogClose,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@ui-kit/Dialog";
import { useCallback, useState } from "react";

interface InviteMismatchModalProps {
	onClose: () => void;
}

export const InviteMismatchModal = ({ onClose }: InviteMismatchModalProps) => {
	const [open, setOpen] = useState(true);

	const onOpenChangeHandler = useCallback(
		(value: boolean) => {
			setOpen(value);
			if (!value) onClose();
		},
		[onClose],
	);

	return (
		<Dialog onOpenChange={onOpenChangeHandler} open={open}>
			<DialogContent data-modal-root>
				<DialogHeader>
					<DialogTitle>{t("enterprise-cloud.invite-mismatch.title")}</DialogTitle>
				</DialogHeader>
				<DialogBody>{t("enterprise-cloud.invite-mismatch.message")}</DialogBody>
				<DialogFooter>
					<DialogClose asChild>
						<Button type="submit">{t("ok")}</Button>
					</DialogClose>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
