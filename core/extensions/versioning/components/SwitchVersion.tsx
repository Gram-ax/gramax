import Icon from "@components/Atoms/Icon";
import TruncatedText from "@components/Atoms/TruncatedText";
import ButtonLink from "@components/Molecules/ButtonLink";
import { useRouter } from "@core/Api/useRouter";
import RouterPathProvider from "@core/RouterPath/RouterPathProvider";
import { useApi, useApiEvent } from "@core-ui/hooks/useApi";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import type GitBranchData from "@ext/git/core/GitBranch/model/GitBranchData";
import t from "@ext/localization/locale/translate";
import { addScopeToPath } from "@ext/versioning/addScopeToPath";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
} from "@ui-kit/Dropdown";
import { useCallback, useEffect, useState } from "react";

const SwitchVersion = () => {
	const { isTauri, isWeb } = usePlatform();
	const catalogName = useCatalogPropsStore((s) => s.data.name);
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

	useApiEvent("on-did-command", ({ command }) => {
		if (command?.startsWith("page/")) setIsLoading(false);
	});

	// biome-ignore lint/correctness/useExhaustiveDependencies: expected
	useEffect(() => {
		// resolvedVersion changing means the switch finished — stop the spinner. The `on-did-command`
		// listener above only fires on platforms that go through the command bus (web/tauri); the
		// docportal fetches page data directly and never emits it, so rely on the store change here.
		setIsLoading(false);
		reset();
		if (!resolvedVersions?.length) return;
		void getBranch();
	}, [resolvedVersion]);

	const router = useRouter();
	const isActualVersion = !resolvedVersion;

	// biome-ignore lint/correctness/useExhaustiveDependencies: expected
	const onSwitch = useCallback(
		(name?: string) => {
			if (name === resolvedVersion?.name || (isActualVersion && name === branch?.name)) return;

			setIsLoading(true);
			const validatedName = name === branch?.name ? null : name;

			if (!isTauri && !isWeb) {
				router.pushPath(addScopeToPath(router.path, validatedName));
				return;
			}

			const data = RouterPathProvider.parsePath(router.path);
			const newPath = RouterPathProvider.getPathname({
				...data,
				catalogName: addScopeToPath(catalogName, validatedName),
			});
			router.pushPath(newPath.value);
		},
		[resolvedVersion, isActualVersion, branch, router],
	);

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
