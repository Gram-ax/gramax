import Icon from "@components/Atoms/Icon";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import { Loader } from "ics-ui-kit/components/loader";
import { Toast, ToastAction } from "@ui-kit/Toast";
import { useCallback, useMemo } from "react";
import { updateCheck } from "../window/commands";
import { ErrorIcon } from "./UpdateIcons";
import useUpdateChecker, { UpdateAcceptance, UpdateStatus } from "./useUpdateChecker";

const Wrapper = styled.div`
	position: absolute;
	bottom: 2rem;
	right: 2rem;
	z-index: var(--z-index-popover);

	@media print {
		display: none;
	}
`;

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

	if (state.state === UpdateStatus.Error)
		return (
			<Wrapper>
				<Toast
					title={t("app.update.error")}
					focus="low"
					icon={<ErrorIcon fw code="alert-circle" />}
					description={state.info.error}
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
		);

	return (
		<Wrapper>
			<Toast
				{...commonToastProps}
				title={t("app.update.available")}
				primaryAction={
					<ToastAction onClick={() => (state.state === UpdateStatus.Ready ? install() : accept())}>
						<Icon code="refresh-ccw" />
					</ToastAction>
				}
			/>
		</Wrapper>
	);
};

export default UpdateChecker;
