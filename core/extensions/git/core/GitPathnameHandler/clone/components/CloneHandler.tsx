import ModalLayout from "@components/Layouts/Modal";
import ModalLayoutLight from "@components/Layouts/ModalLayoutLight";
import { useRouter } from "@core/Api/useRouter";
import CloneWithShareData from "@ext/catalog/actions/share/components/CloneWithShareData";
import ShareData from "@ext/catalog/actions/share/model/ShareData";
import InfoModalForm from "@ext/errorHandlers/client/components/ErrorForm";
import useLocalize from "@ext/localization/useLocalize";
import { useState } from "react";

const CloneHandler = ({ shareData }: { shareData: ShareData }) => {
	const router = useRouter();
	const [isOpen, setIsOpen] = useState(true);
	const [clone, setClone] = useState(false);

	const close = () => setIsOpen(false);

	const cancel = () => {
		close();
		router.pushPath("");
	};

	return (
		<ModalLayout
			isOpen={isOpen}
			onClose={cancel}
			onCmdEnter={(e) => {
				if (!clone) {
					e.stopPropagation();
					setClone(true);
				}
			}}
		>
			{clone ? (
				<ModalLayoutLight>
					<CloneWithShareData
						shareData={shareData}
						onCloneError={cancel}
						onCloneFinish={close}
						onCreateSourceDataClose={(success) => {
							if (!success) close();
						}}
					/>
				</ModalLayoutLight>
			) : (
				<InfoModalForm
					onCancelClick={cancel}
					title={useLocalize("downloadCatalog")}
					actionButton={{
						text: useLocalize("load"),
						onClick: () => setClone(true),
					}}
					isWarning={true}
				>
					<span>{useLocalize("catalogNotClonedDesc")}</span>
				</InfoModalForm>
			)}
		</ModalLayout>
	);
};

export default CloneHandler;
