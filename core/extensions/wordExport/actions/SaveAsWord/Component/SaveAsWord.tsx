import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import FormStyle from "@components/Form/FormStyle";
import ModalLayout from "@components/Layouts/Modal";
import ModalLayoutLight from "@components/Layouts/ModalLayoutLight";
import { useMemo, useState } from "react";
import { CancelableFunction } from "../../../../../logic/utils/CancelableFunction";
import useLocalize from "../../../../localization/useLocalize";

const SaveAsWord = ({ label, onClick }: { label: string; onClick: (signal: AbortSignal) => Promise<void> }) => {
	const [isOpen, setIsOpen] = useState(false);

	const cancelableFunction = useMemo(() => new CancelableFunction(onClick), [onClick]);

	return (
		<ModalLayout
			isOpen={isOpen}
			onOpen={() => {
				setIsOpen(true);
				cancelableFunction.start().finally(() => setIsOpen(false));
			}}
			onClose={() => {
				cancelableFunction.abort();
			}}
			trigger={
				<a>
					<span>{label}</span>
				</a>
			}
		>
			<ModalLayoutLight>
				<FormStyle>
					<>
						<legend>{useLocalize("loading2")}</legend>
						<SpinnerLoader height={100} width={100} fullScreen />
					</>
				</FormStyle>
			</ModalLayoutLight>
		</ModalLayout>
	);
};

export default SaveAsWord;
