import Icon from "@components/Atoms/Icon";
import TruncatedText from "@components/Atoms/TruncatedText";
import ButtonLink from "@components/Molecules/ButtonLink";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
import { useApi } from "@core-ui/hooks/useApi";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import { useRouter } from "@core/Api/useRouter";
import type GitBranchData from "@ext/git/core/GitBranch/model/GitBranchData";
import t from "@ext/localization/locale/translate";
import { addScopeToPath } from "@ext/versioning/utils";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
} from "@ui-kit/Dropdown";
import { useCallback, useEffect, useState } from "react";

const SwitchVersion = () => {
	const { isNext } = usePlatform();
	if (!isNext) return null;

	const catalogProps = CatalogPropsService.value;

	const {
		call: getBranch,
		data: branch,
		reset,
	} = useApi<GitBranchData>({
		url: (api) => api.getCurrentBranch(),
	});

	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		reset();
		if (!catalogProps.resolvedVersions?.length) return;
		void getBranch();
	}, [catalogProps.resolvedVersion]);

	const router = useRouter();

	if (!catalogProps.resolvedVersions?.length) return null;

	const isActualVersion = !catalogProps.resolvedVersion;

	const onSwitch = useCallback(
		(name?: string) => {
			if (name == catalogProps.resolvedVersion?.name || (isActualVersion && name == branch?.name)) return;

			setIsLoading(true);
			router.pushPath(addScopeToPath(router.path, name === branch?.name ? null : name));
		},
		[catalogProps.resolvedVersion, isActualVersion, branch, router],
	);

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
			<DropdownMenuContent align="start">
				<DropdownMenuRadioGroup
					value={catalogProps.resolvedVersion?.name || branch?.name}
					onValueChange={onSwitch}
				>
					<DropdownMenuRadioItem data-qa="qa-clickable" value={branch?.name}>
						<TruncatedText maxWidth={180}>{branch?.name || t("versions.switch")}</TruncatedText>
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
