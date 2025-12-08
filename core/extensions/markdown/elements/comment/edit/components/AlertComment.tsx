import t from "@ext/localization/locale/translate";
import {
	AlertDialog,
	AlertDialogPrimitiveCancel,
	AlertDialogFooter,
	AlertDialogDescription,
	AlertDialogTitle,
	AlertDialogIcon,
	AlertDialogHeader,
	AlertDialogContent,
	AlertDialogPrimitiveAction,
} from "@ui-kit/AlertDialog";
import { Button } from "@ui-kit/Button";
import { useState } from "react";

interface AlertCommentProps {
	onConfirm: () => void;
	onCancel: () => void;
}

export const AlertComment = ({ onConfirm, onCancel }: AlertCommentProps) => {
	const [open, setOpen] = useState(true);
	return (
		<AlertDialog open={open} onOpenChange={setOpen}>
			<AlertDialogContent
				onEscapeKeyDown={() => {
					setOpen(false);
					onCancel();
				}}
			>
				<AlertDialogHeader>
					<AlertDialogIcon icon="info" />
					<AlertDialogTitle>{t("confirmation.unsaved-comment.title")}</AlertDialogTitle>
					<AlertDialogDescription style={{ whiteSpace: "pre-line" }}>
						{t("confirmation.unsaved-comment.body")}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogPrimitiveCancel asChild>
						<Button
							variant="text"
							type="button"
							onClick={() => {
								onCancel();
								setOpen(false);
							}}
						>
							{t("cancel")}
						</Button>
					</AlertDialogPrimitiveCancel>
					<AlertDialogPrimitiveAction
						asChild
						onClick={() => {
							onConfirm();
							setOpen(false);
						}}
					>
						<Button type="button">{t("continue")}</Button>
					</AlertDialogPrimitiveAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
};
