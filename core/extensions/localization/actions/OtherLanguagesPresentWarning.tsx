import type { ClientCatalogProps } from "@core/SitePresenter/SitePresenter";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogHeader,
	AlertDialogIcon,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@ui-kit/AlertDialog";
import { Button } from "@ui-kit/Button";
import { CheckboxField } from "@ui-kit/Checkbox";
import type { MouseEvent as ReactMouseEvent } from "react";
import { cloneElement, useState } from "react";

const DO_NOT_SHOW_AGAIN = "languages.skip-warn";

export const shouldShowActionWarning = (supportedLanguagesLength: number) => supportedLanguagesLength > 1;

export type ActionWarningProps = {
	children?: JSX.Element;
	action: (e?: ReactMouseEvent<HTMLButtonElement>) => void;
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
	const languagesLength = useCatalogPropsStore((state) => state.data.supportedLanguages?.length);
	if (initialDoNotShow || (shouldShowActionWarning && !shouldShowActionWarning(languagesLength))) {
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
		<AlertDialog onOpenChange={onOpenChange} open={isOpen}>
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
						<CheckboxField checked={doNotShowAgain} label={t("do-not-show-again")} />
					</div>
					<div className="flex items-center gap-2">
						<AlertDialogCancel onClick={() => onOpenChange(false)} type="button">
							{t("cancel")}
						</AlertDialogCancel>
						<Button
							onClick={(e) => {
								onConfirm?.(e);
								onOpenChange(false);
							}}
							type="button"
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
