import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import FormStyle from "@components/Form/FormStyle";
import ModalLayout from "@components/Layouts/Modal";
import ModalLayoutLight from "@components/Layouts/ModalLayoutLight";
import ButtonLink from "@components/Molecules/ButtonLink";
import { useMemo, useState } from "react";
import { CancelableFunction } from "@core/utils/CancelableFunction";
import useLocalize from "../../../../localization/useLocalize";

const SaveAsWord = ({ onClick }: { onClick: (signal: AbortSignal) => Promise<void> }) => {
	const [isOpen, setIsOpen] = useState(false);

	const cancelableFunction = useMemo(() => new CancelableFunction(onClick), [onClick]);

	const onOpenHandler = () => {
		setIsOpen(true);
		cancelableFunction.start().finally(() => setIsOpen(false));
	};

	return (
		<ModalLayout
			isOpen={isOpen}
			onOpen={onOpenHandler}
			onClose={() => cancelableFunction.abort()}
			trigger={<ButtonLink iconCode="file-text" text="DOCX" />}
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
