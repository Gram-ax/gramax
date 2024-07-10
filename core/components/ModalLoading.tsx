import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import FormStyle from "@components/Form/FormStyle";
import Modal from "@components/Layouts/Modal";
import ModalLayoutLight from "@components/Layouts/ModalLayoutLight";
import { useState } from "react";

const ModalLoading = ({
	title,
	onOpen,
	onClose,
}: {
	title?: string;
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
			<ModalLayoutLight>
				<FormStyle>
					<>
						{title && <legend>{title}</legend>}
						<SpinnerLoader fullScreen />
					</>
				</FormStyle>
			</ModalLayoutLight>
		</Modal>
	);
};

export default ModalLoading;
