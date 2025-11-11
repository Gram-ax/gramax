import styled from "@emotion/styled";
import { FormBody } from "@ui-kit/Form";
import { Sheet, SheetClose, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@ui-kit/Sheet";

const StyledSheetContent = styled(SheetContent)`
	max-width: 56rem !important;
`;

const StyledSheetFooter = styled(SheetFooter)`
	padding-top: 0.75rem;
`;

interface SheetComponentProps {
	isOpen?: boolean;
	onOpenChange?: (open: boolean) => void;
	sheetContent?: React.ReactNode;
	trigger?: React.ReactNode;
	title?: React.ReactNode;
	confirmButton?: React.ReactNode;
	cancelButton?: React.ReactNode;
}

export const SheetComponent = ({
	isOpen,
	onOpenChange,
	sheetContent,
	trigger,
	title,
	cancelButton,
	confirmButton,
}: SheetComponentProps) => {
	return (
		<Sheet open={isOpen} onOpenChange={onOpenChange}>
			<SheetTrigger asChild>{trigger}</SheetTrigger>
			<StyledSheetContent>
				<SheetHeader>{title && <SheetTitle>{title}</SheetTitle>}</SheetHeader>
				<FormBody style={{ flex: 1 }}>{sheetContent}</FormBody>
				<StyledSheetFooter>
					{confirmButton}
					{cancelButton && <SheetClose asChild>{cancelButton}</SheetClose>}
				</StyledSheetFooter>
			</StyledSheetContent>
		</Sheet>
	);
};
