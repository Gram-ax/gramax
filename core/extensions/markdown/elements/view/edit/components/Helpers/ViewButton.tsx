import Chip from "@components/Atoms/Chip";
import PopupMenuLayout from "@components/Layouts/PopupMenuLayout";
import { ReactNode, useState } from "react";

export interface ViewButtonProps {
	name: ReactNode;
	children: ReactNode;
	tooltipText: string;
	disabled?: boolean;
	closeOnSelection?: boolean;
}

const ViewButton = ({ name, disabled = false, children, tooltipText, closeOnSelection }: ViewButtonProps) => {
	const [isOpen, setIsOpen] = useState(false);
	return (
		<PopupMenuLayout
			hideOnClick={closeOnSelection}
			isInline
			appendTo={() => document.body}
			disabled={disabled}
			onOpen={() => setIsOpen(true)}
			onClose={() => setIsOpen(false)}
			offset={[0, 15]}
			tooltipText={tooltipText}
			trigger={<Chip name={name} focused={isOpen} disabled={disabled} style={{ height: "100%" }} />}
		>
			<>{children}</>
		</PopupMenuLayout>
	);
};

export default ViewButton;
