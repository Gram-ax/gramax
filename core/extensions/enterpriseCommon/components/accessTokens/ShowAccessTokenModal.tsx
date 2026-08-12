import { tryCopyToClipboard } from "@core-ui/utils/clipboard";
import t from "@ext/localization/locale/translate";
import { Button } from "@ui-kit/Button";
import { Dialog, DialogBody, DialogContent } from "@ui-kit/Dialog";
import { FormFooter, FormHeader } from "@ui-kit/Form";
import { InputGroup, InputGroupButton, InputGroupInput } from "@ui-kit/Input";
import { useCallback, useEffect, useState } from "react";

interface ShowAccessTokenModalProps {
	token: string;
	onClose: () => void;
}

export const ShowAccessTokenModal = ({ token, onClose }: ShowAccessTokenModalProps) => {
	const [open, setOpen] = useState(true);
	const [isCopied, setIsCopied] = useState(false);

	useEffect(() => {
		if (!isCopied) return undefined;

		const timeoutId = setTimeout(() => {
			setIsCopied(false);
		}, 1200);

		return () => {
			clearTimeout(timeoutId);
		};
	}, [isCopied]);

	const onOpenChangeHandler = useCallback(
		(value: boolean) => {
			setOpen(value);
			if (!value) onClose();
		},
		[onClose],
	);

	const handleCopyClick = useCallback(() => {
		void tryCopyToClipboard(token, { showPopover: false }).then((copied) => {
			if (copied) setIsCopied(true);
		});
	}, [token]);

	return (
		<Dialog onOpenChange={onOpenChangeHandler} open={open}>
			<DialogContent data-modal-root>
				<FormHeader
					description={t("enterprise-cloud.org-settings.tokens.show-form.description")}
					icon="key-round"
					title={t("enterprise-cloud.org-settings.tokens.show-form.title")}
				/>
				<DialogBody>
					<InputGroup>
						<InputGroupInput
							placeholder={t("enterprise-cloud.org-settings.tokens.show-form.copy-placeholder")}
							readOnly
							value={token}
						/>
						<InputGroupButton icon={isCopied ? "Check" : "Copy"} onClick={handleCopyClick} />
					</InputGroup>
				</DialogBody>
				<FormFooter
					primaryButton={
						<Button onClick={() => onOpenChangeHandler(false)} type="button">
							{t("close")}
						</Button>
					}
				/>
			</DialogContent>
		</Dialog>
	);
};
