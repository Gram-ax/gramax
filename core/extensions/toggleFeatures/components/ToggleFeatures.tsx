import IsMacService from "@core-ui/ContextServices/IsMac";
import isMobileService from "@core-ui/ContextServices/isMobileService";
import LanguageService from "@core-ui/ContextServices/Language";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import styled from "@emotion/styled";
import t from "@ext/localization/locale/translate";
import PermissionService from "@ext/security/logic/Permission/components/PermissionService";
import { configureWorkspacePermission } from "@ext/security/logic/Permission/Permissions";
import { getFeatureList, setFeature, type Feature } from "@ext/toggleFeatures/features";
import { Badge } from "@ui-kit/Badge";
import { Button } from "@ui-kit/Button";
import { Divider } from "@ui-kit/Divider";
import { Popover, PopoverContent, PopoverTrigger } from "@ui-kit/Popover";
import { SwitchField } from "@ui-kit/Switch";
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
	margin-top: 0.75rem;
`;

const Info = styled.a`
	display: inline;
	align-items: center;
`;

const StyledSwitchField = styled(SwitchField)`
	> div {
		width: 100%;
		max-width: 15rem;
	}
`;

const FeatureItem = ({ feature, disabled }: { feature: Feature; disabled: boolean }) => {
	const [enabled, setEnabled] = useState(feature.isEnabled);
	const language = LanguageService.currentUi();
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
				alignment="right"
				label={
					<>
						<span>{title}</span>
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
					</>
				}
				size="sm"
				className="w-full"
				disabled={disabled}
				description={
					<div className="text-xs">
						<span>{desc}. </span>
						{url && (
							<Info href={url} target="_blank" rel="noreferrer">
								{t("read-more")}
							</Info>
						)}
					</div>
				}
				checked={enabled}
				onCheckedChange={onClick}
			/>
		</FeatureWrapper>
	);
};

const ToggleFeatures = () => {
	const isMobile = isMobileService.value;
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
	const { isTauri, isNext, isStatic } = usePlatform();
	const isMac = IsMacService.value;
	const features = isMac && isTauri ? featuresList.filter((f) => f.name !== "cloud") : featuresList;

	if (isNext && !PermissionService.useCheckPermission(configureWorkspacePermission)) return <div></div>;
	if (features.length === 0) return <div></div>;

	return (
		<Popover onOpenChange={onOpenChange} modal>
			<PopoverTrigger asChild>
				<Button size="lg" variant="text" className="h-auto px-0 whitespace-nowrap" endIcon="chevron-down">
					{t("experimental-features.label")}
				</Button>
			</PopoverTrigger>
			<StyledPopoverContent align={isMobile ? "center" : "start"} avoidCollisions side="bottom">
				<div className="flex items-center justify-between" style={{ paddingBottom: "0.75rem" }}>
					<h4 className="font-medium leading-none">{t("experimental-features.label")}</h4>
				</div>
				<Divider />
				{features.map((feature) => (
					<FeatureItem key={feature.name} feature={feature} disabled={isNext || isStatic} />
				))}
			</StyledPopoverContent>
		</Popover>
	);
};

export default ToggleFeatures;
