import Icon from "@components/Atoms/Icon";
import TruncatedText from "@components/Atoms/TruncatedText";
import ButtonLink from "@components/Molecules/ButtonLink";
import FetchService from "@core-ui/ApiServices/FetchService";
import ApiUrlCreatorService from "@core-ui/ContextServices/ApiUrlCreator";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import { useRouter } from "@core/Api/useRouter";
import type GitBranchData from "@ext/git/core/GitBranch/model/GitBranchData";
import t from "@ext/localization/locale/translate";
import { addScopeToPath } from "@ext/versioning/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@ui-kit/Dropdown";
import { DropdownMenuRadioGroup, DropdownMenuRadioItem } from "ics-ui-kit/components/dropdown";
import { useEffect, useState } from "react";

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
		if (name == catalogProps.resolvedVersion?.name || (isActualVersion && name == branch?.name)) return;

		setIsLoading(true);
		router.pushPath(addScopeToPath(router.path, name === branch?.name ? null : name));
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<ButtonLink
					iconIsLoading={isLoading}
					iconCode={"tag"}
					iconFw
					text={
						<TruncatedText maxWidth={180}>
							{isActualVersion ? branch?.name || t("versions.switch") : catalogProps.resolvedVersion.name}
						</TruncatedText>
					}
					rightActions={[<Icon key={0} code="chevron-down" />]}
				/>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" data-qa="dropdown-menu-content">
				<DropdownMenuRadioGroup
					value={catalogProps.resolvedVersion?.name || branch?.name || null}
					onValueChange={onSwitch}
				>
					<DropdownMenuRadioItem data-qa="qa-clickable" value={branch?.name || null}>
						<TruncatedText maxWidth={180}>{branch?.name}</TruncatedText>
					</DropdownMenuRadioItem>
					{catalogProps.resolvedVersions
						?.filter((version) => version.name !== branch?.name)
						.map((version) => (
							<DropdownMenuRadioItem data-qa="qa-clickable" value={version.name} key={version.name}>
								<TruncatedText maxWidth={180}>{version.name}</TruncatedText>
							</DropdownMenuRadioItem>
						))}
				</DropdownMenuRadioGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

export default SwitchVersion;
