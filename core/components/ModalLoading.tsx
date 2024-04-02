import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import LogsLayout from "@components/Layouts/LogsLayout";
import Modal from "@components/Layouts/Modal";
import { useState } from "react";

const ModalLoading = ({
	onOpen,
	onClose,
}: {
	onOpen?: () => Promise<void> | void;
	onClose?: () => Promise<void> | void;
}) => {
	const [isOpen, setisOpen] = useState(true);
	return (
		<Modal
			isOpen={isOpen}
			onOpen={() => {
				setisOpen(true);
				onOpen?.();
			}}
			onClose={() => {
				setisOpen(false);
				onClose?.();
			}}
		>
			<LogsLayout style={{ overflow: "hidden" }}>
				<SpinnerLoader fullScreen />
			</LogsLayout>
		</Modal>
	);
};

export default ModalLoading;
