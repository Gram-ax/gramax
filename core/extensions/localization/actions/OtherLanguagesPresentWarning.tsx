import type { ClientCatalogProps } from "@core/SitePresenter/SitePresenter";
import t from "@ext/localization/locale/translate";
import styled from "@emotion/styled";
import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogCancel,
	AlertDialogDescription,
	AlertDialogTitle,
	AlertDialogHeader,
	AlertDialogTrigger,
	AlertDialogIcon,
} from "@ui-kit/AlertDialog";
import { Button } from "@ui-kit/Button";
import { cloneElement, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { CheckboxField } from "@ui-kit/Checkbox";

const DO_NOT_SHOW_AGAIN = "languages.skip-warn";

export const shouldShowActionWarning = (catalogProps: ClientCatalogProps) =>
	catalogProps?.supportedLanguages?.length > 1;

export type ActionWarningProps = {
	children?: JSX.Element;
	action: (e?: ReactMouseEvent<HTMLButtonElement>) => void;
	catalogProps: ClientCatalogProps;
	isDelete?: boolean;
	onClose?: () => void;
	isOpen?: boolean;
	className?: string;
};

const Footer = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
`;

const OtherLanguagesPresentWarning = ({
	children,
	action,
	catalogProps,
	onClose,
	isDelete,
	isOpen: initialIsOpen,
}: ActionWarningProps) => {
	const [isOpen, setIsOpen] = useState(initialIsOpen);
	const initialDoNotShow = !!localStorage?.getItem(DO_NOT_SHOW_AGAIN);
	const [doNotShowAgain, setDoNotShowAgain] = useState(initialDoNotShow);

	const onConfirm = (e: ReactMouseEvent<HTMLButtonElement>) => {
		action?.(e);
		if (doNotShowAgain) localStorage.setItem(DO_NOT_SHOW_AGAIN, "1");
		onClose?.();
	};

	if (initialDoNotShow || (shouldShowActionWarning && !shouldShowActionWarning(catalogProps))) {
		if (!children) {
			action?.();
			onClose?.();
			return null;
		}

		return cloneElement(children, { onClick: onConfirm });
	}

	const onOpenChange = (open: boolean) => {
		setIsOpen(open);
		if (!open) onClose?.();
	};

	return (
		<AlertDialog open={isOpen} onOpenChange={onOpenChange}>
			<AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
			<AlertDialogContent status="warning">
				<AlertDialogHeader>
					<AlertDialogIcon icon="alert-circle" />
					<AlertDialogTitle>
						{isDelete ? t("multilang.warning.delete.title") : t("multilang.warning.action.title")}
					</AlertDialogTitle>
					<AlertDialogDescription>
						{isDelete ? t("multilang.warning.delete.body") : t("multilang.warning.action.body")}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<Footer>
					<div onClick={() => setDoNotShowAgain(!doNotShowAgain)}>
						<CheckboxField label={t("do-not-show-again")} checked={doNotShowAgain} />
					</div>
					<div className="flex items-center gap-2">
						<AlertDialogCancel type="button" onClick={() => onOpenChange(false)}>
							{t("cancel")}
						</AlertDialogCancel>
						<Button
							type="button"
							onClick={(e) => {
								onConfirm?.(e);
								onOpenChange(false);
							}}
							variant="outline"
						>
							{t("continue")}
						</Button>
					</div>
				</Footer>
			</AlertDialogContent>
		</AlertDialog>
	);
};

export default OtherLanguagesPresentWarning;
