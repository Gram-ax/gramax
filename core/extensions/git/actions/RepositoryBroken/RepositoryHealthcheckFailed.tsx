import { getExecutingEnvironment } from "@app/resolveModule/env";
import resolveModule from "@app/resolveModule/frontend";
import Icon from "@components/Atoms/Icon";
import CloneProgress from "@components/HomePage/CardParts/CloneProgress";
import Path from "@core/FileProvider/Path/Path";
import IsMacService from "@core-ui/ContextServices/IsMac";
import WorkspaceService from "@core-ui/ContextServices/Workspace";
import { useApi } from "@core-ui/hooks/useApi";
import { useDownloadAsZip } from "@core-ui/hooks/useDownloadAsZip";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import styled from "@emotion/styled";
import DefaultErrorComponent from "@ext/errorHandlers/client/components/DefaultError";
import type GetErrorComponent from "@ext/errorHandlers/logic/GetErrorComponent";
import useRemoteProgress from "@ext/git/actions/Clone/logic/useRemoteProgress";
import { ErrorMessage, TechnicalDetails } from "@ext/git/actions/RepositoryBroken/TechnicalDetails";
import t from "@ext/localization/locale/translate";
import { AlertConfirm } from "@ui-kit/AlertDialog/AlertConfirm";
import { Button } from "@ui-kit/Button";
import { Modal, ModalBody, ModalContent, ModalTitle, ModalTrigger } from "@ui-kit/Modal";
import { type ComponentProps, useCallback, useState } from "react";

const FooterWrapper = styled.div`
	display: flex;
	gap: 0.5rem;
	padding: 0rem 1rem 1rem 3rem;
`;

const StyledCloneProgress = styled(CloneProgress)`
	margin-top: 1rem;
`;

const DownloadZip = () => {
	const { download, isDownloading } = useDownloadAsZip();

	return (
		<Button
			disabled={getExecutingEnvironment() === "next" || isDownloading}
			iconClassName={isDownloading ? "animate-spin" : ""}
			onClick={download}
			startIcon={isDownloading ? "loader-circle" : "download"}
			variant="outline"
		>
			{t("git.error.broken.healthcheck.download-zip")}
		</Button>
	);
};

const OpenInExplorer = () => {
	const workspace = WorkspaceService.current();
	const catalogName = useCatalogPropsStore((state) => state.data?.name);

	const path = new Path(workspace.path).join(new Path(catalogName)).value;
	const isMac = IsMacService.value;

	const open = useCallback(() => resolveModule("openInExplorer")(path), [path]);

	if (!workspace) return null;

	return (
		<Button autoFocus onClick={open} variant="outline">
			{isMac ? t("open-in.finder") : t("open-in.explorer")}
		</Button>
	);
};

export type RepositoryHealthcheckFailedProps = {
	trigger: JSX.Element;
	error: Error;
	defaultOpen?: boolean;
};

export const RepositoryHealthcheckError = ({
	error,
	onCancelClick,
}: ComponentProps<typeof GetErrorComponent>): JSX.Element => {
	return <DefaultErrorComponent error={error} onCancelClick={onCancelClick} />;
};

export const RepositoryHealthcheckFailed = ({ trigger, error }: RepositoryHealthcheckFailedProps) => {
	const catalogName = useCatalogPropsStore((state) => state.data?.name);
	const { isTauri } = usePlatform();
	const [open, setOpen] = useState(false);

	const onRecoverCompleted = useCallback(() => {
		setOpen(false);
		refreshPage();
	}, []);

	const { call: resetLock } = useApi({
		url: (api) => api.resetFileLock(),
		onDone: onRecoverCompleted,
		onFinally: useCallback(() => setOpen(false), []),
	});

	const {
		start,
		error: recoverError,
		isCloning: inProgress,
		progress,
	} = useRemoteProgress(catalogName, null, true, null, onRecoverCompleted);

	const { call: startRecovering, error: startRecoveringError } = useApi<{ started: boolean }>({
		url: (api) => api.startRecover(),
		onDone: ({ started }) => started && start(),
		opts: {
			consumeError: true,
		},
	});

	return (
		<Modal modal onOpenChange={setOpen} open={open}>
			<ModalTrigger asChild>{trigger}</ModalTrigger>
			<ModalContent showCloseButton={!inProgress}>
				<ModalBody className="flex flex-row items-start gap-4 lg:py-6">
					<Icon className="text-status-warning" code="triangle-alert" size="24px" />
					<div className="space-y-2">
						<ModalTitle className="text-lg">{t("git.error.broken.healthcheck.title")}</ModalTitle>
						<div className="text-primary-fg">
							{t("git.error.broken.healthcheck.body")},&nbsp;
							<TechnicalDetails error={(error.cause as Error) || error}>
								{t("git.error.broken.healthcheck.technical-details")}
							</TechnicalDetails>
							<br />
							{t("git.error.broken.healthcheck.body2")}
							{(recoverError || startRecoveringError) && (
								<ErrorMessage className="text-status-error">
									<pre>{recoverError?.message || startRecoveringError?.message}</pre>
								</ErrorMessage>
							)}
							<div className="w-full flex justify-center">
								{inProgress && <StyledCloneProgress name={catalogName} progress={progress} />}
							</div>
						</div>
					</div>
				</ModalBody>
				<FooterWrapper>
					<AlertConfirm
						description={t("git.error.broken.healthcheck.ignore.confirm.description")}
						onConfirm={resetLock}
						status="warning"
						title={t("git.error.broken.healthcheck.ignore.confirm.title")}
					>
						<Button
							className="my-auto"
							disabled={inProgress}
							size="lg"
							status="warning"
							style={{ padding: "0.5rem" }}
							variant="link"
						>
							{t("git.error.broken.healthcheck.ignore.button")}
						</Button>
					</AlertConfirm>
					<div className="ml-auto gap-2 flex">
						{isTauri ? <OpenInExplorer /> : <DownloadZip />}
						<AlertConfirm
							description={t("git.error.broken.healthcheck.recover.confirm.description")}
							onConfirm={startRecovering}
							title={t("git.error.broken.healthcheck.recover.confirm.title")}
						>
							<Button autoFocus disabled={inProgress} variant="primary">
								{t("git.error.broken.healthcheck.recover.button")}
							</Button>
						</AlertConfirm>
					</div>
				</FooterWrapper>
			</ModalContent>
		</Modal>
	);
};
