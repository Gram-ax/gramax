import ArticleUpdaterService from "@components/Article/ArticleUpdater/ArticleUpdaterService";
import SpinnerLoader from "@components/Atoms/SpinnerLoader";
import SmallFence from "@components/Labels/SmallFence";
import LogsLayout from "@components/Layouts/LogsLayout";
import ModalLayout from "@components/Layouts/Modal";
import ModalLayoutLight from "@components/Layouts/ModalLayoutLight";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import InfoModalForm from "@ext/errorHandlers/client/components/ErrorForm";
import BranchUpdaterService from "@ext/git/actions/Branch/BranchUpdaterService/logic/BranchUpdaterService";
import useLocalize from "@ext/localization/useLocalize";
import { useState } from "react";

const BranchElement = ({ branchName }: { branchName: string }) => (
	<div title={branchName} style={{ display: "inline-flex" }}>
		<SmallFence overflow="hidden" fixWidth value={branchName} />
	</div>
);

const CheckoutHandler = ({
	currentBranchName,
	branchToCheckout,
}: {
	currentBranchName: string;
	branchToCheckout: string;
}) => {
	const apiUrlCreator = ApiUrlCreatorService.value;
	const [isOpen, setIsOpen] = useState(true);
	const [checkoutProcess, setCheckoutProcess] = useState(false);

	const onCancel = () => {
		setIsOpen(false);
	};

	const onActionButtonClick = async () => {
		const url = apiUrlCreator.getVersionControlCheckoutBranchUrl(branchToCheckout);

		setCheckoutProcess(true);
		const res = await FetchService.fetch(url);
		setCheckoutProcess(false);

		if (!res.ok) {
			onCancel();
			return;
		}
		setIsOpen(false);
		await BranchUpdaterService.updateBranch(apiUrlCreator);
		await ArticleUpdaterService.update(apiUrlCreator);
	};

	const spinnerLoader = (
		<LogsLayout style={{ overflow: "hidden" }}>
			<SpinnerLoader fullScreen />
		</LogsLayout>
	);

	return (
		<ModalLayout isOpen={isOpen} onClose={onCancel}>
			<ModalLayoutLight>
				{checkoutProcess ? (
					spinnerLoader
				) : (
					<InfoModalForm
						onCancelClick={onCancel}
						title={useLocalize("changeBranch") + "?"}
						actionButton={{ text: useLocalize("changeAndSync"), onClick: onActionButtonClick }}
						isWarning={true}
					>
						<span>
							{useLocalize("leadsToTheBranch")}
							<br />
							{useLocalize("checkoutPathnameDesc")}
							<br />
							{useLocalize("changeBranch")} <BranchElement branchName={currentBranchName} />{" "}
							{useLocalize("toBranch").toLowerCase()} <BranchElement branchName={branchToCheckout} />{" "}
							{useLocalize("andSyncCatalog").toLowerCase()}
						</span>
					</InfoModalForm>
				)}
			</ModalLayoutLight>
		</ModalLayout>
	);
};

export default CheckoutHandler;
