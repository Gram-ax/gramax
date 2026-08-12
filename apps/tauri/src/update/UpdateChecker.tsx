import { env } from "@app/resolveModule/env";
import t from "@ext/localization/locale/translate";
import { Icon } from "@ui-kit/Icon";
import { Loader } from "@ui-kit/Loader";
import { Toast, ToastAction, toast } from "@ui-kit/Toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@ui-kit/Tooltip";
import { useCallback, useEffect, useMemo } from "react";
import { updateCheck } from "../window/commands";
import { ErrorIcon } from "./UpdateIcons";
import { UpdateAcceptance } from "./updateEvents";
import useUpdateChecker, { type UpdaterErrorCode, UpdateStatus } from "./useUpdateChecker";

const Wrapper = ({ children }: { children: React.ReactNode }): JSX.Element => {
	return <div className="z-[var(--z-index-overlay)] right-8 bottom-8 absolute print:hidden">{children}</div>;
};

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
		case "run-from-dmg":
			return t("app.update.code.run-from-dmg");
		default:
			return null;
	}
};

const UpdateChecker = () => {
	const { state, resetUpdate, acceptance, install, accept, decline, installed, dismissInstalled } =
		useUpdateChecker();

	useEffect(() => {
		if (env("MACOS_IS_INSTALLED") === "false") {
			toast(t("app.update.dmg.title"), { status: "warning", size: "lg", description: t("app.update.dmg.desc") });
		}
	}, []);

	const retry = useCallback(async () => {
		resetUpdate();
		await updateCheck(true);
		await accept();
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

	if (installed)
		return (
			<Wrapper>
				<Toast
					closeAction
					focus="low"
					icon={<Icon icon="circle-check" size="sm" />}
					onClose={dismissInstalled}
					size="sm"
					status="success"
					title={t("app.update.installed")}
				/>
			</Wrapper>
		);

	if (state.state === UpdateStatus.None || acceptance === UpdateAcceptance.Declined) return null;

	const isAccepted = acceptance === UpdateAcceptance.Accepted;
	const isInProgress = state.state === UpdateStatus.Downloading || state.state === UpdateStatus.Ready;

	if (isAccepted && isInProgress)
		return (
			<Wrapper>
				<Toast
					{...commonToastProps}
					primaryAction={<Loader size="sm" />}
					title={<span className="text-muted">{t("app.update.updating")}</span>}
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
						closeAction
						description={
							<span className="flex items-center gap-1">
								{name}{" "}
								<Tooltip>
									<TooltipTrigger>
										<Icon icon="info" size="sm" />
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
						focus="low"
						icon={<ErrorIcon code="alert-circle" fw />}
						onClose={resetUpdate}
						primaryAction={
							<ToastAction onClick={retry}>
								<Icon icon="refresh-ccw" size="sm" />
							</ToastAction>
						}
						size="sm"
						status="error"
						title={t("app.update.error")}
					/>
				</Wrapper>
			</TooltipProvider>
		);
	}

	return (
		<Wrapper>
			<Toast
				{...commonToastProps}
				primaryAction={
					<ToastAction onClick={() => (state.state === UpdateStatus.Ready ? install() : accept())}>
						<Icon icon="refresh-ccw" size="sm" />
					</ToastAction>
				}
				title={t("app.update.available")}
			/>
		</Wrapper>
	);
};

export default UpdateChecker;
