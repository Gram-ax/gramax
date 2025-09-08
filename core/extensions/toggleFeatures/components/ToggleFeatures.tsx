import { getExecutingEnvironment } from "@app/resolveModule/env";
import Icon from "@components/Atoms/Icon";
import ButtonLink from "@components/Molecules/ButtonLink";
import IsMacService from "@core-ui/ContextServices/IsMac";
import LanguageService from "@core-ui/ContextServices/Language";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import PermissionService from "@ext/security/logic/Permission/components/PermissionService";
import { configureWorkspacePermission } from "@ext/security/logic/Permission/Permissions";
import { getFeatureList, setFeature, type Feature } from "@ext/toggleFeatures/features";
import { Divider } from "@ui-kit/Divider";
import { Label } from "@ui-kit/Label";
import { Badge } from "ics-ui-kit/components/badge";
import { Popover, PopoverContent, PopoverTrigger } from "ics-ui-kit/components/popover";
import { Switch } from "ics-ui-kit/components/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";
import { useCallback, useRef, useState } from "react";

const StyledPopoverContent = styled(PopoverContent)`
	width: 100%;
	font-size: 0.875rem;
	line-height: 1.25rem;
	min-width: 20rem;
`;

const FeatureWrapper = styled.div`
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	gap: 0.2rem;
	margin-top: 1.2rem;
`;

const FeatureContent = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 0.25rem;
	flex: 1;
`;

const SwitchWrapper = styled.div`
	display: flex;
	align-items: center;
	height: 100%;
`;

const FeatureDescription = styled.div`
	font-size: 0.75rem;
	line-height: 1.2;
	max-width: 15rem;
`;

const FeatureInfo = styled.div`
	display: flex;
	align-items: center;
	gap: 0.4rem;
`;

const Info = styled.a`
	display: inline;
	align-items: center;
`;

const FeatureTitle = ({ feature }: { feature: Feature }) => {
	const language = LanguageService.currentUi();

	const title = language === "ru" ? feature.title.ru : feature.title.en;

	return <Label>{title}</Label>;
};

const FeatureItem = ({ feature }: { feature: Feature }) => {
	const [enabled, setEnabled] = useState(feature.isEnabled);
	const language = LanguageService.currentUi();
	const desc = language === "ru" ? feature.desc?.ru : feature.desc?.en;

	return (
		<FeatureWrapper>
			<FeatureContent>
				<FeatureInfo>
					<Icon code={feature.icon} />

					<FeatureTitle feature={feature} />

					{feature.status && (
						<Tooltip>
							<TooltipTrigger tabIndex={-1}>
								{feature.status === "in-dev" && (
									<Badge status="error" size="sm" focus="low">
										In Dev
									</Badge>
								)}

								{feature.status === "experimental" && (
									<Badge status="warning" size="sm" focus="low">
										Experimental
									</Badge>
								)}

								{feature.status === "unstable" && (
									<Badge status="info" size="sm" focus="low">
										Unstable
									</Badge>
								)}

								{feature.status === "beta" && (
									<Badge size="sm" focus="low">
										Beta
									</Badge>
								)}
							</TooltipTrigger>
							<TooltipContent>{t(`experimental-features.status.${feature.status}`)}</TooltipContent>
						</Tooltip>
					)}
				</FeatureInfo>

				<Switch
					size="sm"
					checked={enabled}
					disabled={getExecutingEnvironment() === "next"}
					onCheckedChange={(e) => {
						if (getExecutingEnvironment() === "next") return;
						setEnabled(e);
						setFeature(feature.name, e);
					}}
				/>
			</FeatureContent>

			<SwitchWrapper>
				{desc && (
					<FeatureDescription className="text-muted">
						<span>{desc}. </span>
						{feature.url && (
							<Info
								href={feature.url}
								target={getExecutingEnvironment() === "tauri" ? "" : "_blank"}
								rel="noreferrer"
							>
								{t("read-more")}
							</Info>
						)}
					</FeatureDescription>
				)}
			</SwitchWrapper>
		</FeatureWrapper>
	);
};

const ToggleFeatures = () => {
	const initial = useRef<Record<string, boolean>>();

	const onOpenChange = useCallback(
		(open: boolean) => {
			if (open) {
				initial.current = {};
				getFeatureList().forEach((feature) => (initial.current[feature.name] = feature.isEnabled));
				return;
			}

			const hasChanges = getFeatureList().some((feature) => initial.current[feature.name] !== feature.isEnabled);
			if (hasChanges) window.location.reload();
		},
		[initial],
	);

	const featuresList = getFeatureList();

	// temp, waiting for fix in mac desktop
	const { isTauri, isNext } = usePlatform();
	const isMac = IsMacService.value;
	const features = isMac && isTauri ? featuresList.filter((f) => f.name !== "cloud") : featuresList;

	if (isNext && !PermissionService.useCheckPermission(configureWorkspacePermission)) return null;
	if (features.length === 0) return <div></div>;

	return (
		<Popover onOpenChange={onOpenChange} modal>
			<PopoverTrigger asChild>
				<ButtonLink text={t("experimental-features.label")} />
			</PopoverTrigger>
			<StyledPopoverContent align="center" avoidCollisions side="bottom">
				<div className="flex items-center justify-between" style={{ paddingBottom: "0.66rem" }}>
					<h4 className="font-medium leading-none">{t("experimental-features.label")}</h4>
				</div>
				<Divider />
				{features.map((feature) => (
					<FeatureItem key={feature.name} feature={feature} />
				))}
			</StyledPopoverContent>
		</Popover>
	);
};

export default ToggleFeatures;
