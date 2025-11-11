import Icon from "@components/Atoms/Icon";
import TruncatedText from "@components/Atoms/TruncatedText";
import ButtonLink from "@components/Molecules/ButtonLink";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import useWatch from "@core-ui/hooks/useWatch";
import { useRouter } from "@core/Api/useRouter";
import RouterPathProvider from "@core/RouterPath/RouterPathProvider";
import t from "@ext/localization/locale/translate";
import { feature } from "@ext/toggleFeatures/features";
import { addScopeToPath } from "@ext/versioning/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@ui-kit/Dropdown";
import { DropdownMenuRadioGroup, DropdownMenuRadioItem } from "@ui-kit/Dropdown";
import { useState } from "react";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";

const SwitchFilteredCatalog = () => {
	if (!feature("filtered-catalog")) return null;

	const { filterProperties, resolvedFilterProperty, name } = useCatalogPropsStore(
		(state) => ({
			filterProperties: state.data?.filterProperties,
			resolvedFilterProperty: state.data?.resolvedFilterProperty,
			name: state.data?.name,
		}),
		"shallow",
	);
	const [isLoading, setIsLoading] = useState(false);
	const router = useRouter();

	const { isTauri, isBrowser } = usePlatform();

	useWatch(() => setIsLoading(false), [filterProperties, resolvedFilterProperty, name]);

	if (!filterProperties?.length) return null;

	const isActual = !resolvedFilterProperty;

	const onSwitch = (propertyName?: string) => {
		if (propertyName == resolvedFilterProperty) return;

		setIsLoading(true);

		if (!isTauri && !isBrowser) {
			router.pushPath(addScopeToPath(router.path, propertyName));
			return;
		}

		const data = RouterPathProvider.parsePath(router.path);
		const newPath = RouterPathProvider.getPathname({
			...data,
			catalogName: addScopeToPath(name, propertyName),
		});
		router.pushPath(newPath.value);
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<ButtonLink
					iconIsLoading={isLoading}
					iconCode={"funnel"}
					iconFw
					text={
						<TruncatedText maxWidth={180}>
							{isActual ? t("filterProperties.switch") : resolvedFilterProperty}
						</TruncatedText>
					}
					rightActions={[<Icon key={0} code="chevron-down" />]}
				/>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start">
				<DropdownMenuRadioGroup value={resolvedFilterProperty || null} onValueChange={onSwitch}>
					<DropdownMenuRadioItem value={null}>
						<TruncatedText maxWidth={180}>{t("filterProperties.unfilter")}</TruncatedText>
					</DropdownMenuRadioItem>
					{filterProperties?.map((property) => (
						<DropdownMenuRadioItem value={property} key={property}>
							<TruncatedText maxWidth={180}>{property}</TruncatedText>
						</DropdownMenuRadioItem>
					))}
				</DropdownMenuRadioGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

export default SwitchFilteredCatalog;
