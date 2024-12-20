import { getExecutingEnvironment } from "@app/resolveModule/env";
import { assertDesktopOpened } from "@components/Actions/EditInGramax";
import ModalLayout from "@components/Layouts/Modal";
import ModalLayoutLight from "@components/Layouts/ModalLayoutLight";
import { useRouter } from "@core/Api/useRouter";
import CloneWithShareData from "@ext/catalog/actions/share/components/CloneWithShareData";
import ShareData from "@ext/catalog/actions/share/model/ShareData";
import InfoModalForm from "@ext/errorHandlers/client/components/ErrorForm";
import OnNetworkApiErrorService from "@ext/errorHandlers/client/OnNetworkApiErrorService";
import t from "@ext/localization/locale/translate";
import { useEffect, useState } from "react";

const CloneHandler = ({ shareData }: { shareData: ShareData }) => {
	const router = useRouter();
	const [clone, setClone] = useState(false);
	const [isOpen, setIsOpen] = useState(true);
	const [clonePath, setClonePath] = useState("");

	const close = () => setIsOpen(false);

	useEffect(() => {
		if (!isOpen) return;
		setClonePath(window.location.pathname);
		router.pushPath("/");
	}, [isOpen]);

	return (
		<ModalLayout
			isOpen={isOpen}
			onClose={close}
			onCmdEnter={(e) => {
				if (!clone) {
					e.stopPropagation();
					setClone(true);
				}
			}}
		>
			{clone ? (
				<ModalLayoutLight>
					<OnNetworkApiErrorService.Provider callback={close}>
						<CloneWithShareData
							shareData={shareData}
							onCloneStart={close}
							onCreateSourceDataClose={(success) => {
								if (!success) close();
							}}
						/>
					</OnNetworkApiErrorService.Provider>
				</ModalLayoutLight>
			) : (
				<InfoModalForm
					onCancelClick={close}
					title={t("git.clone.not-cloned.title")}
					actionButton={{
						text: t("catalog.clone"),
						onClick: () => setClone(true),
					}}
					isWarning={true}
				>
					<div>{t("git.clone.not-cloned.body")}</div>
					{getExecutingEnvironment() == "browser" && (
						<div>
							<a onClick={assertDesktopOpened} href={`gramax://${clonePath}`} style={{ outline: 0 }}>
								{t("git.clone.open-in-app")}
							</a>
						</div>
					)}
				</InfoModalForm>
			)}
		</ModalLayout>
	);
};

export default CloneHandler;
