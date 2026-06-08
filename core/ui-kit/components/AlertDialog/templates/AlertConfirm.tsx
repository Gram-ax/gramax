import type { IconCode } from "@components/Atoms/Icon/LucideIcon";
import t from "@ext/localization/locale/translate";
import { AlertDialogContent } from "@ui-kit/AlertDialog/AlertDialogContent";
import { AlertDialogIcon } from "@ui-kit/AlertDialog/AlertDialogIcon";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "ics-ui-kit/components/alert-dialog";
import { type ComponentProps, useState } from "react";

export type AlertConfirmProps = {
	title: string;
	description: string;

	children?: JSX.Element;
	icon?: IconCode;
	status?: ComponentProps<typeof AlertDialogContent>["status"];

	confirmText?: string;
	cancelText?: string;
	onConfirm?: () => void;
	onCancel?: () => void;

	asChild?: boolean;
};

export const AlertConfirm = (props: AlertConfirmProps) => {
	const {
		children,
		title,
		description,
		status,
		confirmText = t("continue"),
		cancelText = t("cancel"),
		onConfirm,
		onCancel,
		icon = "loader-circle",
		asChild = true,
	} = props;

	// Open the dialog on initial render if children are not provided
	const [open, setOpen] = useState(!children);

	return (
		<AlertDialog onOpenChange={setOpen} open={open}>
			{children && <AlertDialogTrigger asChild={asChild}>{children}</AlertDialogTrigger>}
			<AlertDialogContent
				onEscapeKeyDown={() => {
					onCancel?.();
					setOpen(false);
				}}
				status={status}
			>
				<AlertDialogHeader>
					<AlertDialogIcon icon={icon} />
					<AlertDialogTitle>{title}</AlertDialogTitle>
					<AlertDialogDescription>{description}</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel
						onClick={() => {
							onCancel?.();
							setOpen(false);
						}}
						variant="text"
					>
						{cancelText}
					</AlertDialogCancel>
					<AlertDialogAction
						onClick={() => {
							onConfirm?.();
							setOpen(false);
						}}
					>
						{confirmText}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
};
