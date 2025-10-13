import Icon from "@components/Atoms/Icon";
import TruncatedText from "@components/Atoms/TruncatedText";
import ButtonLink from "@components/Molecules/ButtonLink";
import CatalogPropsService from "@core-ui/ContextServices/CatalogProps";
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

const SwitchFilteredCatalog = () => {
	if (!feature("filtered-catalog")) return null;

	const catalogProps = CatalogPropsService.value;
	const [isLoading, setIsLoading] = useState(false);
	const router = useRouter();

	const { isTauri, isBrowser } = usePlatform();

	useWatch(() => setIsLoading(false), [catalogProps]);

	if (!catalogProps.filterProperties?.length) return null;

	const isActual = !catalogProps.resolvedFilterProperty;

	const onSwitch = (name?: string) => {
		if (name == catalogProps.resolvedFilterProperty) return;

		setIsLoading(true);

		if (!isTauri && !isBrowser) {
			router.pushPath(addScopeToPath(router.path, name));
			return;
		}

		const data = RouterPathProvider.parsePath(router.path);
		const newPath = RouterPathProvider.getPathname({
			...data,
			catalogName: addScopeToPath(catalogProps.name, name),
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
							{isActual ? t("filterProperties.switch") : catalogProps.resolvedFilterProperty}
						</TruncatedText>
					}
					rightActions={[<Icon key={0} code="chevron-down" />]}
				/>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start">
				<DropdownMenuRadioGroup value={catalogProps.resolvedFilterProperty || null} onValueChange={onSwitch}>
					<DropdownMenuRadioItem value={null}>
						<TruncatedText maxWidth={180}>{t("filterProperties.unfilter")}</TruncatedText>
					</DropdownMenuRadioItem>
					{catalogProps.filterProperties?.map((property) => (
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
