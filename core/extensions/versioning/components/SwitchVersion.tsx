import Icon from "@components/Atoms/Icon";
import TruncatedText from "@components/Atoms/TruncatedText";
import ButtonLink from "@components/Molecules/ButtonLink";
import { useRouter } from "@core/Api/useRouter";
import { useApi } from "@core-ui/hooks/useApi";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
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
					iconCode={"tag"}
					iconFw
					iconIsLoading={isLoading}
					rightActions={[<Icon code="chevron-down" key={0} />]}
					text={
						<TruncatedText maxWidth={180}>
							{isActualVersion ? branch?.name || t("versions.switch") : resolvedVersion.name}
						</TruncatedText>
					}
				/>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start">
				<DropdownMenuRadioGroup onValueChange={onSwitch} value={resolvedVersion?.name || branch?.name}>
					<DropdownMenuRadioItem data-qa="qa-clickable" value={branch?.name}>
						<TruncatedText maxWidth={180}>{branch?.name || t("versions.switch")}</TruncatedText>
					</DropdownMenuRadioItem>
					{resolvedVersions
						?.filter((version) => version.name !== branch?.name)
						.map((version) => (
							<DropdownMenuRadioItem data-qa="qa-clickable" key={version.name} value={version.name}>
								<TruncatedText maxWidth={180}>{version.name}</TruncatedText>
							</DropdownMenuRadioItem>
						))}
				</DropdownMenuRadioGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

export default SwitchVersion;
