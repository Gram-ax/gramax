import type { UpdateCheckResult } from "@app/resolveModule";
import resolveModule from "@app/resolveModule/frontend";
import Divider from "@components/Atoms/Divider";
import { SectionContainer } from "@ext/catalog/actions/propsEditor/components/Sections/SectionContainer";
import t from "@ext/localization/locale/translate";
import { useSetting } from "@ext/settings/logic/hooks";
import { markUpdateCheck, UpdateCheckFrequency } from "@ext/settings/logic/updateCheckPolicy";
import { Button } from "@ui-kit/Button";
import { Icon } from "@ui-kit/Icon";
import { Label } from "@ui-kit/Label";
import { Loader } from "@ui-kit/Loader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@ui-kit/Select";
import { useCallback, useState } from "react";

type CheckStatus = "idle" | "checking" | "check-error" | UpdateCheckResult;

const formatCheckError = (e: unknown): string => {
	if (typeof e === "string") return e;
	if (e && typeof e === "object") {
		const inner = "inner" in e ? (e as { inner: unknown }).inner : e;
		if (inner && typeof inner === "object" && "message" in inner) {
			const { message, src } = inner as { message: string; src?: string | null };
			return src ? `${message} (${src})` : message;
		}
		return JSON.stringify(e);
	}
	return String(e);
};

const checkStatusText = (status: CheckStatus): string | null => {
	switch (status) {
		case "checking":
			return t("app-settings.updates.check.checking");
		case "update-found":
			return t("app-settings.updates.check.update-found");
		case "up-to-date":
			return t("app-settings.updates.check.up-to-date");
		case "in-progress":
			return t("app-settings.updates.check.in-progress");
		case "check-error":
			return t("app-settings.updates.check.error");
		default:
			return null;
	}
};

const UpdatesSection = ({ onClose }: { onClose?: () => void }) => {
	const [frequency, setFrequency] = useSetting("updates.check-frequency");
	const [checkStatus, setCheckStatus] = useState<CheckStatus>("idle");
	const [checkErrorDetails, setCheckErrorDetails] = useState<string | null>(null);
	const [installing, setInstalling] = useState(false);
	const [installError, setInstallError] = useState(false);

	const onFrequencyChange = useCallback(
		(value: string) => setFrequency(value as UpdateCheckFrequency),
		[setFrequency],
	);

	const check = useCallback(async () => {
		setCheckStatus("checking");
		setCheckErrorDetails(null);
		try {
			const result = await resolveModule("updateCheck")(false);
			markUpdateCheck();
			setCheckStatus(result);
			// The update is already downloaded by now, so accepting it installs and restarts the app.
			// Close the settings first — otherwise the update toast stays hidden behind the modal.
			if (result === "update-found") {
				onClose?.();
				resolveModule("updateAccept")();
			}
		} catch (e) {
			setCheckErrorDetails(formatCheckError(e));
			setCheckStatus("check-error");
		}
	}, [onClose]);

	const installFromCache = useCallback(async () => {
		setInstallError(false);
		setInstalling(true);
		try {
			// Opens a file picker in the update cache directory; on success the app restarts.
			await resolveModule("updateInstallFromCache")();
		} catch {
			setInstallError(true);
		} finally {
			setInstalling(false);
		}
	}, []);

	const statusText = checkStatusText(checkStatus);

	return (
		<SectionContainer stackClassName="space-y-6">
			<div className="flex flex-col gap-2">
				<Label>{t("app-settings.updates.frequency.title")}</Label>
				<Select onValueChange={onFrequencyChange} value={frequency}>
					<SelectTrigger>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value={UpdateCheckFrequency.EveryLaunch}>
							{t("app-settings.updates.frequency.every-launch")}
						</SelectItem>
						<SelectItem value={UpdateCheckFrequency.Daily}>
							{t("app-settings.updates.frequency.daily")}
						</SelectItem>
						<SelectItem value={UpdateCheckFrequency.Weekly}>
							{t("app-settings.updates.frequency.weekly")}
						</SelectItem>
						<SelectItem value={UpdateCheckFrequency.Never}>
							{t("app-settings.updates.frequency.never")}
						</SelectItem>
					</SelectContent>
				</Select>
				<p className="text-sm text-muted">{t("app-settings.updates.frequency.description")}</p>
			</div>
			<div className="flex flex-col gap-2">
				<div className="flex items-center gap-3">
					<Button
						className="w-full"
						disabled={installing}
						onClick={installFromCache}
						type="button"
						variant="outline"
					>
						{installing ? <Loader className="px-0" size="md" /> : <Icon icon="archive-restore" size="md" />}
						{t("app-settings.updates.install-from-cache.action")}
					</Button>
				</div>
				<p className="text-sm text-muted">{t("app-settings.updates.install-from-cache.description")}</p>
				{installError && (
					<span className="text-sm" style={{ color: "var(--color-text-error)" }}>
						{t("app-settings.updates.install-from-cache.error")}
					</span>
				)}
			</div>
			<Divider />
			<div className="flex flex-col gap-2">
				<div className="flex items-center w-full gap-3">
					<Button
						className="w-full"
						disabled={checkStatus === "checking"}
						onClick={check}
						type="button"
						variant="outline"
					>
						{checkStatus === "checking" ? (
							<Loader className="px-0" size="md" />
						) : (
							<Icon icon="refresh-ccw" size="md" />
						)}
						{t("app-settings.updates.check.action")}
					</Button>
				</div>
				{statusText && (
					<span
						className={`text-sm ${checkStatus === "check-error" ? "" : "text-muted"}`}
						style={checkStatus === "check-error" ? { color: "var(--color-text-error)" } : undefined}
					>
						{statusText}
						{checkStatus === "check-error" && checkErrorDetails && (
							<span style={{ whiteSpace: "pre-line" }}>: {checkErrorDetails}</span>
						)}
					</span>
				)}
			</div>
		</SectionContainer>
	);
};

export default UpdatesSection;
