import Icon from "@components/Atoms/Icon";
import { useRouter } from "@core/Api/useRouter";
import { RequestStatus, useApi } from "@core-ui/hooks/useApi";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import styled from "@emotion/styled";
import { makeGitShareData } from "@ext/git/actions/Clone/logic/makeGitShareData";
import { useCloneRepo } from "@ext/git/actions/Clone/logic/useCloneRepo";
import { ErrorMessage, TechnicalDetails } from "@ext/git/actions/RepositoryBroken/TechnicalDetails";
import getUrlFromShareData from "@ext/git/core/GitPathnameHandler/clone/logic/getUrlFromShareData";
import type GitStorageData from "@ext/git/core/model/GitStorageData";
import t from "@ext/localization/locale/translate";
import useStorage from "@ext/storage/logic/utils/useStorage";
import { AlertConfirm } from "@ui-kit/AlertDialog/AlertConfirm";
import { Button } from "@ui-kit/Button";
import { Modal, ModalBody, ModalContent, ModalTitle, ModalTrigger } from "@ui-kit/Modal";
import { useMemo, useState } from "react";

export type RepositoryNotFullyClonedProps = {
	trigger: JSX.Element;
	error: Error;
};

const FooterWrapper = styled.div`
	display: flex;
	gap: 0.5rem;
	padding: 0rem 1rem 1rem 3rem;
`;

export const RepositoryNotFullyCloned = ({ trigger, error }: RepositoryNotFullyClonedProps) => {
	const router = useRouter();
	const { name, link } = useCatalogPropsStore(
		(state) => ({ name: state.data?.name, link: state.data?.link.pathname }),
		"shallow",
	);

	const {
		call: removeCatalog,
		status: removeStatus,
		error: removeCatalogError,
	} = useApi({
		url: (api) => api.removeCatalog(),
		onDone: () => {
			setOpen(false);
			void router.pushPath("/");
		},
	});

	const source = useStorage();

	const url = useMemo(() => getUrlFromShareData(makeGitShareData(link)), [link]);

	const { startClone } = useCloneRepo({
		storageData: {
			name: name,
			url,
			source,
		} as GitStorageData,
		deleteIfExists: true,
		skipCheck: true,
		redirectOnClone: link,
		onStart: () => {
			setOpen(false);
			void router.pushPath("/");
		},
	});

	const isBusy = removeStatus === RequestStatus.Loading;

	const [open, setOpen] = useState(false);

	return (
		<Modal onOpenChange={setOpen} open={open}>
			<ModalTrigger asChild>{trigger}</ModalTrigger>
			<ModalContent>
				<ModalBody className="flex flex-row items-start gap-4 lg:py-6">
					<Icon className="text-status-error" code="circle-alert" size="24px" />
					<div className="space-y-2">
						<ModalTitle className="text-lg">{t("git.error.broken.clone-failed.title")}</ModalTitle>
						<p style={{ paddingBottom: "1rem" }}>{t("git.error.broken.clone-failed.body")}</p>
						{removeCatalogError && (
							<ErrorMessage className="text-status-error">
								<pre>{removeCatalogError?.message}</pre>
							</ErrorMessage>
						)}
					</div>
				</ModalBody>
				<FooterWrapper>
					<TechnicalDetails error={error}>
						<Button className="p-0 h-auto underline" size="xl" variant="link">
							{t("git.error.broken.clone-failed.technical-details")}
						</Button>
					</TechnicalDetails>
					<div className="ml-auto gap-2 flex">
						<AlertConfirm
							description={t("git.error.broken.clone-failed.delete.description")}
							onConfirm={removeCatalog}
							title={t("git.error.broken.clone-failed.title")}
						>
							<Button
								className="ml-auto text-sm"
								disabled={isBusy}
								iconClassName={isBusy ? "animate-spin" : ""}
								startIcon={isBusy ? "loader-circle" : null}
								variant="outline"
							>
								{t("git.error.broken.clone-failed.delete.button")}
							</Button>
						</AlertConfirm>
						<AlertConfirm
							description={t("git.error.broken.clone-failed.clone.description")}
							onConfirm={startClone}
							title={t("git.error.broken.clone-failed.clone.title")}
						>
							<Button className="text-sm" variant="primary">
								{t("git.error.broken.clone-failed.clone.button")}
							</Button>
						</AlertConfirm>
					</div>
				</FooterWrapper>
			</ModalContent>
		</Modal>
	);
};
