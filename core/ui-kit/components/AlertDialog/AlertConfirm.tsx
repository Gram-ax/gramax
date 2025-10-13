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
} from "ics-ui-kit/components/alert-dialog";
import { Button } from "ics-ui-kit/components/button";
import { AlertCircle } from "lucide-react";
import { useState, type ComponentProps } from "react";

export type AlertConfirmProps = {
	children: JSX.Element;
	title: string;
	description: string;
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
		asChild = true,
	} = props;

	const [open, setOpen] = useState(false);

	return (
		<AlertDialog open={open} onOpenChange={setOpen}>
			<AlertDialogTrigger asChild={asChild}>{children}</AlertDialogTrigger>
			<AlertDialogContent status={status}>
				<AlertDialogHeader>
					<AlertDialogIcon icon={AlertCircle} />
					<AlertDialogTitle>{title}</AlertDialogTitle>
					<AlertDialogDescription>{description}</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel onClick={onCancel}>{cancelText}</AlertDialogCancel>
					{onConfirm && (
						<Button
							status={status}
							variant="primary"
							onClick={() => {
								onConfirm();
								setOpen(false);
							}}
							autoFocus
						>
							{confirmText}
						</Button>
					)}
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
};
