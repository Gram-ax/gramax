import { getExecutingEnvironment } from "@app/resolveModule/env";
import { assertDesktopOpened } from "@components/Actions/EditInGramax";
import ModalLayout from "@components/Layouts/Modal";
import ModalLayoutLight from "@components/Layouts/ModalLayoutLight";
import CloneWithShareData from "@ext/catalog/actions/share/components/CloneWithShareData";
import ShareData from "@ext/catalog/actions/share/model/ShareData";
import InfoModalForm from "@ext/errorHandlers/client/components/ErrorForm";
import t from "@ext/localization/locale/translate";
import { useState } from "react";

const CloneHandler = ({ shareData }: { shareData: ShareData }) => {
	const [clone, setClone] = useState(false);
	const [isOpen, setIsOpen] = useState(true);

	const close = () => setIsOpen(false);

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
					<CloneWithShareData
						shareData={shareData}
						onCloneStart={close}
						onCreateSourceDataClose={(success) => {
							if (!success) close();
						}}
					/>
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
							<a
								onClick={assertDesktopOpened}
								href={`gramax://${window.location.pathname}`}
								style={{ outline: 0 }}
							>
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
