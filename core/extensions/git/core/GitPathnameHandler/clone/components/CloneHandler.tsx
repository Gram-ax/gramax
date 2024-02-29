import ModalLayout from "@components/Layouts/Modal";
import ModalLayoutLight from "@components/Layouts/ModalLayoutLight";
import { useRouter } from "@core/Api/useRouter";
import CloneWithShareData from "@ext/catalog/actions/share/components/CloneWithShareData";
import ShareData from "@ext/catalog/actions/share/model/ShareData";
import InfoModalForm from "@ext/errorHandlers/client/components/ErrorForm";
import getRepUrl from "@ext/git/core/GitPathnameHandler/clone/logic/getRepUrl";
import CurrentLink from "@ext/git/core/GitPathnameHandler/components/CurrentLink";
import useLocalize from "@ext/localization/useLocalize";
import { useMemo, useState } from "react";

const CloneHandler = ({ href, shareData }: { href: string; shareData: ShareData }) => {
	const router = useRouter();
	const [isOpen, setIsOpen] = useState(true);
	const [clone, setClone] = useState(false);
	const repUrl = useMemo(() => getRepUrl(shareData), [href]);

	const close = () => setIsOpen(false);

	const cancel = () => {
		close();
		router.pushPath("");
	};

	return (
		<ModalLayout isOpen={isOpen} onClose={cancel}>
			<ModalLayoutLight>
				{clone ? (
					<CloneWithShareData
						shareData={shareData}
						onCloneError={cancel}
						onCloneFinish={close}
						onCreateSourceDataClose={close}
					/>
				) : (
					<InfoModalForm
						onCancelClick={cancel}
						title={useLocalize("catalogNotCloned")}
						actionButton={{
							text: useLocalize("clone"),
							onClick: () => setClone(true),
						}}
						isError={false}
					>
						<span>
							{useLocalize("link")} <CurrentLink href={href} />{" "}
							{useLocalize("leadsToTheRepo").toLowerCase()}{" "}
							<a
								href={repUrl.href}
								style={{ wordBreak: "break-all", outline: "none" }}
								target="_blank"
								rel="noreferrer"
							>
								{repUrl.value}
							</a>
							. {useLocalize("clone")} {useLocalize("catalog2")}?
						</span>
					</InfoModalForm>
				)}
			</ModalLayoutLight>
		</ModalLayout>
	);
};

export default CloneHandler;
