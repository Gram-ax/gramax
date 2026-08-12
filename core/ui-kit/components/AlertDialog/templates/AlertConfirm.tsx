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
import { type ComponentProps, type ReactNode, useState } from "react";

export type AlertConfirmProps = {
	title: ReactNode;
	description: ReactNode;

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
				{/* keep the lg grid layout (icon column + left-aligned text) at all widths — the default
				    switches to a centered column below lg, which breaks in narrow desktop windows */}
				<AlertDialogHeader className="grid grid-cols-[0_1fr] items-start gap-y-4 has-[>svg]:grid-cols-[1.5rem_1fr] has-[>svg]:gap-x-4">
					<AlertDialogIcon icon={icon} />
					<AlertDialogTitle className="col-start-2 mb-0 text-left">{title}</AlertDialogTitle>
					<AlertDialogDescription className="col-start-2 text-left">{description}</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel
						onClick={() => {
							onCancel?.();
							setOpen(false);
						}}
						variant="outline"
					>
						{cancelText}
					</AlertDialogCancel>
					{onConfirm && (
						<AlertDialogAction
							onClick={() => {
								onConfirm?.();
								setOpen(false);
							}}
						>
							{confirmText}
						</AlertDialogAction>
					)}
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
};
