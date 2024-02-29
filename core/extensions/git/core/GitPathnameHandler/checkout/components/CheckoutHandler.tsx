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
import CurrentLink from "@ext/git/core/GitPathnameHandler/components/CurrentLink";
import useLocalize from "@ext/localization/useLocalize";
import { useState } from "react";

const CheckoutHandler = ({ href, branchName }: { href: string; branchName: string }) => {
	const apiUrlCreator = ApiUrlCreatorService.value;
	const [isOpen, setIsOpen] = useState(true);
	const [checkoutProcess, setCheckoutProcess] = useState(false);

	const onCancel = () => {
		setIsOpen(false);
	};

	const onActionButtonClick = async () => {
		const url = apiUrlCreator.getVersionControlCheckoutBranchUrl(branchName);

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

	const branchElement = (
		<div title={branchName} style={{ display: "inline-flex" }}>
			<SmallFence overflow="hidden" fixWidth value={branchName} />
		</div>
	);

	return (
		<ModalLayout isOpen={isOpen} onClose={onCancel}>
			<ModalLayoutLight>
				{checkoutProcess ? (
					spinnerLoader
				) : (
					<InfoModalForm
						onCancelClick={onCancel}
						title={useLocalize("goToLink")}
						actionButton={{ text: useLocalize("changeAndSync"), onClick: onActionButtonClick }}
						isError={false}
					>
						<span>
							{useLocalize("link")} <CurrentLink href={href} />{" "}
							{useLocalize("leadsToTheBranch").toLocaleLowerCase()} {branchElement}.{" "}
						</span>
						<span>{useLocalize("checkoutPathnameConfirm")}</span>
					</InfoModalForm>
				)}
			</ModalLayoutLight>
		</ModalLayout>
	);
};

export default CheckoutHandler;
