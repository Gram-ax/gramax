import { cn } from "@core-ui/utils/cn";
import type { ButtonProps } from "@ui-kit/Button";
import type { UiKitButtonProps } from "@ui-kit/Button/Button";
import {
	Dialog,
	DialogBody,
	DialogContent,
	DialogFooterTemplate,
	DialogHeaderTemplate,
	DialogTrigger,
} from "@ui-kit/Dialog";
import type { ModalContentSize } from "@ui-kit/Dialog/DialogContent";

interface ModalComponentProps {
	isOpen?: boolean;
	onOpenChange?: (open: boolean) => void;
	modalContent?: React.ReactNode;
	trigger?: React.ReactNode;
	title?: React.ReactNode;
	description?: React.ReactNode;
	confirmButtonText?: React.ReactNode;
	cancelButtonText?: React.ReactNode;
	confirmButtonProps?: ButtonProps;
	cancelButtonProps?: ButtonProps;
	modalContentClassName?: string;
	size?: ModalContentSize;
}

export const ModalComponent = ({
	isOpen,
	onOpenChange,
	modalContent,
	trigger,
	description,
	title,
	cancelButtonText,
	confirmButtonText,
	confirmButtonProps,
	cancelButtonProps,
	modalContentClassName,
	size,
}: ModalComponentProps) => {
	return (
		<Dialog onOpenChange={onOpenChange} open={isOpen}>
			<DialogTrigger asChild>{trigger}</DialogTrigger>
			<DialogContent
				className={cn("font-sans font-normal", modalContentClassName)}
				overlayType={"dimmed"}
				size={size}
			>
				{(title || description) && (
					<DialogHeaderTemplate className="pb-0 lg:pb-0 border-b-0" description={description} title={title} />
				)}
				{modalContent && <DialogBody>{modalContent}</DialogBody>}
				{(confirmButtonText || cancelButtonText) && (
					<DialogFooterTemplate
						className="pt-0 lg:pt-0 border-t-0"
						primaryButton={confirmButtonText}
						primaryButtonProps={confirmButtonProps as UiKitButtonProps}
						secondaryButton={cancelButtonText}
						secondaryButtonProps={cancelButtonProps as UiKitButtonProps}
					/>
				)}
			</DialogContent>
		</Dialog>
	);
};
