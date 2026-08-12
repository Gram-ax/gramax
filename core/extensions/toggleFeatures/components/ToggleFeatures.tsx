import IsMacService from "@core-ui/ContextServices/IsMac";
import isMobileService from "@core-ui/ContextServices/isMobileService";
import { useUiLanguage } from "@core-ui/ContextServices/Language";
import PageDataContext from "@core-ui/ContextServices/PageDataContext";
import { usePlatform } from "@core-ui/hooks/usePlatform";
// biome-ignore lint/style/noRestrictedImports: it's ok
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import PermissionService from "@ext/security/logic/Permission/components/PermissionService";
import { configureWorkspacePermission } from "@ext/security/logic/Permission/Permissions";
import { type Feature, getFeatureList, setFeature } from "@ext/toggleFeatures/features";
import { Badge } from "@ui-kit/Badge";
import { Button } from "@ui-kit/Button";
import { Divider } from "@ui-kit/Divider";
import { Popover, PopoverContent, PopoverTrigger } from "@ui-kit/Popover";
import { SwitchField } from "@ui-kit/Switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";
import { useCallback, useEffect, useRef, useState } from "react";

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
	margin-top: 0.75rem;
`;

const Info = styled.a`
	display: inline;
	align-items: center;
`;

const StyledSwitchField = styled(SwitchField)`
	> div {
		width: 100%;
		max-width: 100%;
	}

	label {
		line-height: 1.5;
	}
`;

const FeatureItem = ({ feature, disabled }: { feature: Feature; disabled: boolean }) => {
	const [enabled, setEnabled] = useState(feature.isEnabled);
	const language = useUiLanguage();
	const title = language === "ru" ? feature.title.ru : feature.title.en;
	const desc = language === "ru" ? feature.desc?.ru : feature.desc?.en;
	const url = language === "ru" ? feature.url?.ru : feature.url?.en;

	const onClick = useCallback(
		(e) => {
			setEnabled(e);
			setFeature(feature.name, e);
		},
		[feature.name],
	);

	return (
		<FeatureWrapper>
			<StyledSwitchField
				alignment="left"
				checked={enabled}
				className="w-full"
				description={
					<div className="text-xs">
						<span>{desc}. </span>
						{url && (
							<Info href={url} rel="noreferrer" target="_blank">
								{t("read-more")}
							</Info>
						)}
					</div>
				}
				disabled={disabled}
				label={
					<>
						<span>{title}</span>
						{feature.status && (
							<Tooltip>
								<TooltipTrigger tabIndex={-1}>
									{feature.status === "in-dev" && (
										<Badge focus="low" size="sm" status="error">
											In Dev
										</Badge>
									)}

									{feature.status === "experimental" && (
										<Badge focus="low" size="sm" status="warning">
											Experimental
										</Badge>
									)}

									{feature.status === "unstable" && (
										<Badge focus="low" size="sm" status="info">
											Unstable
										</Badge>
									)}

									{feature.status === "beta" && (
										<Badge focus="low" size="sm">
											Beta
										</Badge>
									)}
								</TooltipTrigger>
								<TooltipContent>{t(`experimental-features.status.${feature.status}`)}</TooltipContent>
							</Tooltip>
						)}
					</>
				}
				onCheckedChange={onClick}
				size="sm"
			/>
		</FeatureWrapper>
	);
};

export const FeatureList = () => {
	const isRelease = PageDataContext.value.conf.isRelease;
	// temp, waiting for fix in mac desktop
	const { isTauri, isNext, isStatic } = usePlatform();
	const isMac = IsMacService.value;
	const canConfigure = PermissionService.useCheckPermission(configureWorkspacePermission);

	// Capture enabled state on mount; reload on unmount (settings close) if any
	// feature changed, so toggles take effect — like the popover's reload-on-close.
	const initial = useRef<Record<string, boolean>>();
	useEffect(() => {
		initial.current = Object.fromEntries(getFeatureList().map((f) => [f.name, f.isEnabled]));
		return () => {
			const changed = getFeatureList().some((f) => initial.current?.[f.name] !== f.isEnabled);
			if (changed) location.reload();
		};
	}, []);

	const featuresList = getFeatureList();
	const features = isMac && isTauri ? featuresList.filter((f) => f.name !== "cloud") : featuresList;

	if (isNext && !canConfigure) return null;
	if (features.length === 0) return null;

	return (
		<div className="flex flex-col">
			{features.map((feature) => {
				if (feature.status === "in-dev" && isRelease) return null;
				return <FeatureItem disabled={isNext || isStatic} feature={feature} key={feature.name} />;
			})}
		</div>
	);
};

const ToggleFeatures = () => {
	const isMobile = isMobileService.value;
	const initial = useRef<Record<string, boolean>>();

	// biome-ignore lint/correctness/useExhaustiveDependencies: it's ok
	const onOpenChange = useCallback(
		(open: boolean) => {
			if (open) {
				initial.current = {};
				getFeatureList().forEach((feature) => {
					initial.current[feature.name] = feature.isEnabled;
				});
				return;
			}

			const hasChanges = getFeatureList().some((feature) => initial.current[feature.name] !== feature.isEnabled);
			if (hasChanges) location.reload();
		},
		[initial],
	);

	return (
		<Popover modal onOpenChange={onOpenChange}>
			<PopoverTrigger asChild>
				<Button className="h-auto px-0 whitespace-nowrap" endIcon="chevron-down" size="lg" variant="text">
					{t("experimental-features.label")}
				</Button>
			</PopoverTrigger>
			<StyledPopoverContent align={isMobile ? "center" : "start"} avoidCollisions side="bottom">
				<div className="flex items-center justify-between" style={{ paddingBottom: "0.75rem" }}>
					<h4 className="font-medium leading-none">{t("experimental-features.label")}</h4>
				</div>
				<Divider />
				<FeatureList />
			</StyledPopoverContent>
		</Popover>
	);
};

export default ToggleFeatures;
