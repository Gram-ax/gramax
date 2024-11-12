import { getExecutingEnvironment } from "@app/resolveModule/env";
import Icon from "@components/Atoms/Icon";
import Tooltip from "@components/Atoms/Tooltip";
import PopupMenuLayout from "@components/Layouts/PopupMenuLayout";
import ButtonLink from "@components/Molecules/ButtonLink";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import DateUtils from "@core-ui/utils/dateUtils";
import { useRouter } from "@core/Api/useRouter";
import styled from "@emotion/styled";
import type GitBranchData from "@ext/git/core/GitBranch/model/GitBranchData";
import t from "@ext/localization/locale/translate";
import { addGitTreeScopeToPath } from "@ext/versioning/utils";
import { useEffect, useRef, useState, type ReactNode } from "react";

const TruncatedText = ({ children }: { children: ReactNode }) => {
	const ref = useRef<HTMLDivElement>(null);
	const [isOverflowing, setIsOverflowing] = useState(false);

	const TruncatedDiv = styled.div`
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		display: block;
		max-width: 180px;
	`;

	useEffect(() => setIsOverflowing(ref.current.clientWidth >= 179), [children]);

	return (
		<Tooltip hideInMobile hideOnClick placement="left" content={isOverflowing ? children : null}>
			<TruncatedDiv ref={ref}>{children}</TruncatedDiv>
		</Tooltip>
	);
};

const SwitchVersion = () => {
	if (getExecutingEnvironment() != "next") return null;

	const catalogProps = CatalogPropsService.value;
	const [branch, setBranch] = useState<GitBranchData>(null);
	const [isLoading, setIsLoading] = useState(false);
	const apiUrlCreator = ApiUrlCreatorService.value;

	useEffect(() => {
		const f = async () => {
			const branchR = await FetchService.fetch(apiUrlCreator.getVersionControlCurrentBranchUrl());
			setBranch(await branchR.json());
		};
		void f();
	}, []);

	useEffect(() => {
		setIsLoading(false);
	}, [catalogProps.resolvedVersion]);

	const router = useRouter();

	if (!catalogProps.resolvedVersions?.length || !branch) return null;

	const onSwitch = (name?: string) => {
		setIsLoading(true);
		router.pushPath(addGitTreeScopeToPath(router.path, name));
	};

	return (
		<PopupMenuLayout
			disabled={isLoading}
			trigger={
				<ButtonLink
					iconIsLoading={isLoading}
					iconCode={"tag"}
					iconFw
					text={
						<TruncatedText>
							{catalogProps.resolvedVersion ? catalogProps.resolvedVersion.name : t("versions.switch")}
						</TruncatedText>
					}
					rightActions={[<Icon key={0} code="chevron-down" />]}
				/>
			}
		>
			{catalogProps.resolvedVersions
				?.filter((version) => version.name !== branch.name)
				.map((version, idx) => {
					const disabled = version.name === catalogProps.resolvedVersion?.name;
					return (
						<Tooltip
							key={idx}
							hideOnClick
							hideInMobile
							content={disabled ? t("versions.current-version") : null}
						>
							<ButtonLink
								onClick={disabled ? undefined : () => onSwitch(version.name)}
								key={`button-${idx}`}
								iconCode={disabled ? "check" : version.kind === "tag" ? "tag" : "git-branch"}
								iconContent={
									version.date ? DateUtils.getRelativeDateTime(version.date.toString()) : null
								}
								iconFw
								text={<TruncatedText>{version.name}</TruncatedText>}
							/>
						</Tooltip>
					);
				})}
		</PopupMenuLayout>
	);
};

export default SwitchVersion;
