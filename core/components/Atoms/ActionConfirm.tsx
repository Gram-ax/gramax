import type { ClientCatalogProps } from "@core/SitePresenter/SitePresenter";
import t from "@ext/localization/locale/translate";
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogIcon,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@ui-kit/AlertDialog";
import { Button } from "@ui-kit/Button";
import { CheckboxField } from "@ui-kit/Checkbox";
import { cloneElement, useCallback, useState } from "react";

const localStorage = typeof window !== "undefined" ? window.localStorage : null;

export type ActionConfirmProps = {
	children?: JSX.Element;
	initialIsOpen?: boolean;

	onConfirm?: () => void;
	onClose?: () => void;

	confirmTitle: string;
	confirmBody: React.ReactNode | string;

	confirmText?: string;
	cancelText?: string;

	shouldShow?: () => boolean;
	doNotShowAgainKey?: string;

	className?: string;
};

export type ActionWarningProps = {
	children?: JSX.Element;
	action: (...args: any[]) => void;
	catalogProps: ClientCatalogProps;
	isDelete?: boolean;
	onClose?: () => void;
	isOpen?: boolean;
	className?: string;
};

const ActionConfirm = (props: ActionConfirmProps) => {
	const {
		children,
		initialIsOpen,
		onConfirm,
		onClose,
		confirmTitle: title,
		confirmBody: body,
		confirmText = t("continue"),
		cancelText = t("cancel"),
		shouldShow,
		doNotShowAgainKey,
	} = props;

	const initialDoNotShow = !!localStorage?.getItem(doNotShowAgainKey);

	const [isOpen, setIsOpen] = useState(initialIsOpen);
	const [doNotShowAgain, setDoNotShowAgain] = useState(initialDoNotShow);

	const onConfirmClick = useCallback(() => {
		setIsOpen(false);
		if (doNotShowAgainKey) {
			doNotShowAgain
				? localStorage?.setItem(doNotShowAgainKey, "1")
				: localStorage?.removeItem(doNotShowAgainKey);
		}
		onConfirm?.();
	}, [doNotShowAgain, doNotShowAgainKey, onConfirm]);

	if (initialDoNotShow || (shouldShow && !shouldShow())) {
		if (!children) {
			onConfirm?.();
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
		<AlertDialog onOpenChange={onOpenChange} open={isOpen}>
			{children && <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>}
			<AlertDialogContent status="warning">
				<AlertDialogHeader>
					<AlertDialogIcon icon="alert-circle" />
					<AlertDialogTitle>{title}</AlertDialogTitle>
					<AlertDialogDescription>{body}</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<div className="flex items-center justify-between w-full">
						{doNotShowAgainKey ? (
							<CheckboxField
								checked={doNotShowAgain}
								label={t("do-not-show-again")}
								onCheckedChange={(checked: boolean) => setDoNotShowAgain(checked)}
							/>
						) : (
							<div />
						)}
						<div className="flex items-center gap-2">
							<AlertDialogCancel>{cancelText}</AlertDialogCancel>
							<Button
								onClick={() => {
									onConfirmClick();
									onOpenChange(false);
								}}
								type="button"
								variant="outline"
							>
								{confirmText}
							</Button>
						</div>
					</div>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
};

export default ActionConfirm;
