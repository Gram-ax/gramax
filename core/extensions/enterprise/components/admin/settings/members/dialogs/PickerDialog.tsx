import { Button } from "@ext/enterprise/components/admin/ui-kit/Button";
import { CancelButton } from "@ext/enterprise/components/admin/ui-kit/CancelButton";
import t from "@ext/localization/locale/translate";
import { Counter } from "@ui-kit/Counter";
import {
	Dialog,
	DialogBody,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@ui-kit/Dialog";
import { type ReactNode, useCallback } from "react";

interface PickerDialogProps {
	count: number;
	open: boolean;
	onClose: () => void;
	title: string;
	onPicked: () => void;
	children: ReactNode;
}

export const PickerDialog = (props: PickerDialogProps) => {
	const { count, title, onClose, onPicked, open, children } = props;

	const picked = useCallback(() => {
		onPicked();
		onClose();
	}, [onPicked, onClose]);

	return (
		<Dialog onOpenChange={(o) => !o && onClose()} open={open}>
			{/* <DialogTrigger></DialogTrigger> */}
			<DialogContent
				className="font-sans font-normal focus-visible:outline-none"
				overlayType="dimmed"
				showCloseButton={false}
				size="L"
			>
				<DialogHeader>
					<DialogDescription className="sr-only absolute !p-0">
						{t("enterprise.admin.settings-title")}
					</DialogDescription>
					<div className="flex items-center justify-between gap-3">
						<DialogTitle>{title}</DialogTitle>
						<div className="flex-shrink-0 flex gap-3">
							<DialogClose asChild>
								<CancelButton />
							</DialogClose>
							<Button disabled={count === 0} onClick={picked}>
								{t("add")}{" "}
								{count > 0 && (
									<Counter className="tabular-nums p-0 min-w-0 text-inverse-muted" variant="text">
										{count}
									</Counter>
								)}
							</Button>
						</div>
					</div>
				</DialogHeader>
				<DialogBody>{children}</DialogBody>
			</DialogContent>
		</Dialog>
	);
};
