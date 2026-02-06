/** biome-ignore-all lint/correctness/useHookAtTopLevel: feature is a constant */
import TruncatedText from "@components/Atoms/TruncatedText";
import ButtonLink from "@components/Molecules/ButtonLink";
import { useRouter } from "@core/Api/useRouter";
import RouterPathProvider from "@core/RouterPath/RouterPathProvider";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import useWatch from "@core-ui/hooks/useWatch";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import t from "@ext/localization/locale/translate";
import { enumTypes, PropertyTypes } from "@ext/properties/models";
import { feature } from "@ext/toggleFeatures/features";
import { addScopeToPath } from "@ext/versioning/utils";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@ui-kit/Dropdown";
import { Icon } from "@ui-kit/Icon";
import { useState } from "react";

const SwitchFilteredCatalog = () => {
	if (!feature("filtered-catalog")) return null;

	const { selectedProperty, resolvedFilterPropertyValue, name } = useCatalogPropsStore(
		(state) => ({
			selectedProperty: state.data?.properties?.find((p) => p.name === state.data?.filterProperty),
			resolvedFilterPropertyValue: state.data?.resolvedFilterPropertyValue,
			name: state.data?.name,
		}),
		"shallow",
	);

	const [isLoading, setIsLoading] = useState(false);
	const router = useRouter();
	const { isTauri, isBrowser } = usePlatform();

	useWatch(() => setIsLoading(false), [selectedProperty, resolvedFilterPropertyValue, name]);

	if (!selectedProperty) return null;

	const getFilterDisplayText = (): string => {
		if (!resolvedFilterPropertyValue) {
			return t("filterProperties.switch");
		}

		if (resolvedFilterPropertyValue === "any") {
			return `${t("filterProperties.hasProperty")}: ${selectedProperty.name}`;
		}

		return resolvedFilterPropertyValue;
	};

	const onSwitch = (filterValue?: string) => {
		if (filterValue === resolvedFilterPropertyValue) return;

		setIsLoading(true);

		if (!isTauri && !isBrowser) {
			router.pushPath(addScopeToPath(router.path, filterValue));
			return;
		}

		const data = RouterPathProvider.parsePath(router.path);
		const newPath = RouterPathProvider.getPathname({
			...data,
			catalogName: addScopeToPath(name, filterValue),
		});
		router.pushPath(newPath.value);
	};

	const isEnumOrMany = enumTypes.includes(selectedProperty.type);
	const isFlag = selectedProperty.type === PropertyTypes.flag;

	const availableValues = selectedProperty.values || [];

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<ButtonLink
					iconCode="funnel"
					iconFw
					iconIsLoading={isLoading}
					rightActions={[<Icon icon="chevron-down" key={0} />]}
					text={<TruncatedText maxWidth={180}>{getFilterDisplayText()}</TruncatedText>}
				/>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" className="min-w-60">
				<DropdownMenuRadioGroup onValueChange={onSwitch} value={resolvedFilterPropertyValue || ""}>
					<DropdownMenuGroup>
						<DropdownMenuLabel className="text-xs font-normal text-muted">
							{selectedProperty.name}
						</DropdownMenuLabel>

						<DropdownMenuRadioItem value="">
							<TruncatedText maxWidth={180}>{t("filterProperties.unfilter")}</TruncatedText>
						</DropdownMenuRadioItem>

						{isEnumOrMany && availableValues.length > 0 && (
							<>
								<DropdownMenuSeparator />
								<DropdownMenuLabel className="text-xs font-normal text-muted">
									{t("filterProperties.value")}
								</DropdownMenuLabel>
								{availableValues.map((value) => (
									<DropdownMenuRadioItem key={value} value={value}>
										<TruncatedText maxWidth={180}>{value}</TruncatedText>
									</DropdownMenuRadioItem>
								))}
							</>
						)}

						{isFlag && (
							<>
								<DropdownMenuSeparator />
								<DropdownMenuRadioItem value={selectedProperty.name}>
									<TruncatedText
										maxWidth={180}
									>{`${t("filterProperties.hasProperty")}: ${selectedProperty.name}`}</TruncatedText>
								</DropdownMenuRadioItem>
							</>
						)}
					</DropdownMenuGroup>
				</DropdownMenuRadioGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

export default SwitchFilteredCatalog;
