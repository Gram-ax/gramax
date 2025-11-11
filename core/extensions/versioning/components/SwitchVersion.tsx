import Icon from "@components/Atoms/Icon";
import TruncatedText from "@components/Atoms/TruncatedText";
import ButtonLink from "@components/Molecules/ButtonLink";
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
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";

const SwitchVersion = () => {
	const { isNext } = usePlatform();

	const { resolvedVersions, resolvedVersion } = useCatalogPropsStore(
		(state) => ({
			resolvedVersions: state.data.resolvedVersions,
			resolvedVersion: state.data.resolvedVersion,
		}),
		"shallow",
	);

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
		if (!resolvedVersions?.length) return;
		void getBranch();
	}, [resolvedVersion]);

	const router = useRouter();

	const isActualVersion = !resolvedVersion;

	const onSwitch = useCallback(
		(name?: string) => {
			if (name == resolvedVersion?.name || (isActualVersion && name == branch?.name)) return;

			setIsLoading(true);
			router.pushPath(addScopeToPath(router.path, name === branch?.name ? null : name));
		},
		[resolvedVersion, isActualVersion, branch, router],
	);

	if (!isNext) return null;
	if (!resolvedVersions?.length) return null;

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<ButtonLink
					iconIsLoading={isLoading}
					iconCode={"tag"}
					iconFw
					text={
						<TruncatedText maxWidth={180}>
							{isActualVersion ? branch?.name || t("versions.switch") : resolvedVersion.name}
						</TruncatedText>
					}
					rightActions={[<Icon key={0} code="chevron-down" />]}
				/>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start">
				<DropdownMenuRadioGroup value={resolvedVersion?.name || branch?.name} onValueChange={onSwitch}>
					<DropdownMenuRadioItem data-qa="qa-clickable" value={branch?.name}>
						<TruncatedText maxWidth={180}>{branch?.name || t("versions.switch")}</TruncatedText>
					</DropdownMenuRadioItem>
					{resolvedVersions
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
