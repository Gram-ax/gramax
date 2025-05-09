import Icon from "@components/Atoms/Icon";
import Tooltip from "@components/Atoms/Tooltip";
import PopupMenuLayout from "@components/Layouts/PopupMenuLayout";
import ButtonLink from "@components/Molecules/ButtonLink";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import { usePlatform } from "@core-ui/hooks/usePlatform";
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
	const { isNext } = usePlatform();
	if (!isNext) return null;

	const catalogProps = CatalogPropsService.value;
	const [branch, setBranch] = useState<GitBranchData>(null);
	const [isLoading, setIsLoading] = useState(false);
	const apiUrlCreator = ApiUrlCreatorService.value;

	useEffect(() => {
		const f = async () => {
			const branchR = await FetchService.fetch(apiUrlCreator.getVersionControlCurrentBranchUrl());
			if (branchR.ok) setBranch(await branchR.json());
		};
		void f();
	}, []);

	useEffect(() => {
		setIsLoading(false);
	}, [catalogProps.resolvedVersion]);

	const router = useRouter();

	if (!catalogProps.resolvedVersions?.length) return null;

	const isActualVersion = !catalogProps.resolvedVersion;

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
							{isActualVersion ? branch?.name || t("versions.switch") : catalogProps.resolvedVersion.name}
						</TruncatedText>
					}
					rightActions={[<Icon key={0} code="chevron-down" />]}
				/>
			}
		>
			<>
				<Tooltip hideOnClick hideInMobile content={isActualVersion ? t("versions.current-version") : null}>
					<ButtonLink
						onClick={isActualVersion ? undefined : () => onSwitch()}
						iconFw
						fullWidth={isActualVersion}
						text={<TruncatedText>{branch?.name}</TruncatedText>}
						rightActions={isActualVersion ? [<Icon key={0} code="check" />] : null}
					/>
				</Tooltip>
				{catalogProps.resolvedVersions
					?.filter((version) => version.name !== branch?.name)
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
									iconFw
									fullWidth={disabled}
									text={<TruncatedText>{version.name}</TruncatedText>}
									rightActions={disabled ? [<Icon key={0} code="check" />] : null}
								/>
							</Tooltip>
						);
					})}
			</>
		</PopupMenuLayout>
	);
};

export default SwitchVersion;
