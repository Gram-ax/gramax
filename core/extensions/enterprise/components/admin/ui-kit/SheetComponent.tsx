import type { AlertMessageState } from "@ext/enterprise/components/admin/hooks/useAlertMessage";
import { ConnectionErrorBadge } from "@ext/enterprise/components/admin/ui-kit/ConnectionErrorBadge";
import { HeaderAlert } from "@ext/enterprise/components/admin/ui-kit/HeaderAlert";
import { FormBody } from "@ui-kit/Form";
import {
	Sheet,
	SheetClose,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@ui-kit/Sheet";

interface SheetComponentProps {
	isOpen?: boolean;
	onOpenChange?: (open: boolean) => void;
	sheetContent?: React.ReactNode;
	error?: AlertMessageState;
	connectionError?: AlertMessageState;
	trigger?: React.ReactNode;
	title?: React.ReactNode;
	confirmButton?: React.ReactNode;
	cancelButton?: React.ReactNode;
	showCloseButton?: boolean;
}

export const SheetComponent = ({
	isOpen,
	onOpenChange,
	sheetContent,
	error,
	connectionError,
	trigger,
	title,
	cancelButton,
	confirmButton,
	showCloseButton,
}: SheetComponentProps) => {
	return (
		<Sheet onOpenChange={onOpenChange} open={isOpen}>
			<SheetTrigger asChild>{trigger}</SheetTrigger>
			<SheetContent
				className="focus-visible:outline-none font-sans font-normal"
				overlayType="dimmed"
				showCloseButton={showCloseButton === true}
				style={{ maxWidth: "48rem" }}
			>
				<SheetHeader className="border-b">
					<div className="flex items-center justify-between gap-3">
						{title && <SheetTitle className="min-w-0 w-full">{title}</SheetTitle>}
						<div className="flex-shrink-0 flex items-center gap-3">
							<ConnectionErrorBadge alert={connectionError} />
							{cancelButton && <SheetClose asChild>{cancelButton}</SheetClose>}
							{confirmButton}
						</div>
					</div>
					<HeaderAlert alert={error} />
					<SheetDescription className="sr-only absolute !p-0">{title}</SheetDescription>
				</SheetHeader>
				<FormBody style={{ flex: 1 }}>{sheetContent}</FormBody>
			</SheetContent>
		</Sheet>
	);
};
