import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import { Icon } from "@ui-kit/Icon";
import { Toast, ToastAction } from "@ui-kit/Toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@ui-kit/Tooltip";
import { Loader } from "@ui-kit/Loader";
import { useCallback, useMemo } from "react";
import { updateCheck } from "../window/commands";
import { ErrorIcon } from "./UpdateIcons";
import useUpdateChecker, { UpdateAcceptance, UpdateStatus, type UpdaterErrorCode } from "./useUpdateChecker";

const Wrapper = styled.div`
	position: absolute;
	bottom: 2rem;
	right: 2rem;
	z-index: var(--z-index-overlay);

	@media print {
		display: none;
	}
`;

const translated = (code: UpdaterErrorCode): string | null => {
	switch (code) {
		case "check-enterprise-version":
			return t("app.update.code.check-enterprise-version");
		case "install-failed":
			return t("app.update.code.install");
		case "check-failed":
			return t("app.update.code.check");
		case "not-found":
			return t("app.update.code.not-found");
		case "download-failed":
			return t("app.update.code.download-failed");
		case "signature-mismatch":
			return t("app.update.code.signature");
		case "reqwest":
			return t("app.update.code.reqwest");
		default:
			return null;
	}
};

const UpdateChecker = () => {
	const { state, resetUpdate, acceptance, install, accept, decline } = useUpdateChecker();

	const retry = useCallback(async () => {
		resetUpdate();
		await updateCheck(true);
		accept();
	}, [resetUpdate, accept]);

	const commonToastProps = useMemo(
		() => ({
			status: "default" as const,
			size: "sm" as const,
			focus: "low" as const,
			closeAction: true,
			onClose: decline,
		}),
		[decline],
	);

	if (state.state === UpdateStatus.None || acceptance === UpdateAcceptance.Declined) return null;

	const isAccepted = acceptance === UpdateAcceptance.Accepted;
	const isInProgress = state.state === UpdateStatus.Downloading || state.state === UpdateStatus.Ready;

	if (isAccepted && isInProgress)
		return (
			<Wrapper>
				<Toast
					{...commonToastProps}
					title={<span className="text-muted">{t("app.update.updating")}</span>}
					primaryAction={<Loader size="md" />}
				/>
			</Wrapper>
		);

	if (state.state === UpdateStatus.Error) {
		const message = "inner" in state.info ? state.info.inner.message : state.info.message;
		const src = "inner" in state.info ? state.info.inner.src : state.info.src;

		const name = translated(state.info.code) || message;

		return (
			<TooltipProvider>
				<Wrapper>
					<Toast
						title={t("app.update.error")}
						focus="low"
						icon={<ErrorIcon fw code="alert-circle" />}
						description={
							<span className="flex items-center gap-1">
								{name}{" "}
								<Tooltip>
									<TooltipTrigger>
										<Icon icon="info" />
									</TooltipTrigger>
									<TooltipContent>
										<div style={{ whiteSpace: "pre-line" }}>
											{message?.charAt(0).toUpperCase() + message?.slice(1)}{" "}
											{src ? `(${src})` : ""}
										</div>
									</TooltipContent>
								</Tooltip>
							</span>
						}
						status="error"
						size="lg"
						closeAction
						onClose={resetUpdate}
						primaryAction={
							<ToastAction onClick={retry}>
								<span>{t("app.update.retry")}</span>
							</ToastAction>
						}
					/>
				</Wrapper>
			</TooltipProvider>
		);
	}

	return (
		<Wrapper>
			<Toast
				{...commonToastProps}
				title={t("app.update.available")}
				primaryAction={
					<ToastAction onClick={() => (state.state === UpdateStatus.Ready ? install() : accept())}>
						<Icon icon="refresh-ccw" size="sm" />
					</ToastAction>
				}
			/>
		</Wrapper>
	);
};

export default UpdateChecker;
