import type { IconCode } from "@components/Atoms/Icon/LucideIcon";
import type Style from "@components/HomePage/Cards/model/Style";
import CardView from "@components/HomePage/CardView";
import CatalogLogoService from "@core-ui/ContextServices/CatalogLogoService/Context";
import type { CatalogLogo } from "@core-ui/ContextServices/CatalogLogoService/catalogLogoHooks";
import { cn } from "@core-ui/utils/cn";
import t from "@ext/localization/locale/translate";
import type { CatalogLink } from "@ext/navigation/NavigationLinks";
import { useSetting } from "@ext/settings/logic/hooks";
import Theme from "@ext/Theme/Theme";
import { Icon } from "@ui-kit/Icon";
import { FieldLabel } from "@ui-kit/Label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui-kit/Tabs";
import { useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { FormData } from "../logic/createFormSchema";

interface CatalogCardPreviewProps {
	form: UseFormReturn<FormData>;
}

type FormLogoEntry = NonNullable<NonNullable<FormData["logo"]>["light"]>;

const getCatalogLogo = (formEntry: FormLogoEntry): CatalogLogo => {
	if (!formEntry) return;
	if (formEntry.type === "icon") return { iconCode: formEntry.code as IconCode, iconColor: formEntry.color };
	if (formEntry.type === "emoji") return { emoji: formEntry.emoji };
	if (formEntry.type === "file") return { src: formEntry.preview };
};

export const CatalogCardPreview = ({ form }: CatalogCardPreviewProps) => {
	const [initialTheme] = useSetting("general.theme");
	const [theme, setTheme] = useState(initialTheme);
	const catalogName = form.watch("title");
	const description = form.watch("description");
	const formLogo = form.watch("logo");
	const style = form.watch("style") as Style;

	const { lightLogo, darkLogo } = CatalogLogoService.value();
	const dirtyLogoFields = form.formState.dirtyFields?.logo;

	const getLogo = (): CatalogLogo => {
		const isDark = theme === Theme.dark;
		const formEntry = isDark ? (formLogo?.dark ?? formLogo?.light) : (formLogo?.light ?? formLogo?.dark);

		const logo = getCatalogLogo(formEntry);
		if (logo) return logo;

		const lightDirty = Boolean(dirtyLogoFields?.light);
		const darkDirty = Boolean(dirtyLogoFields?.dark);
		const isExplicitlyCleared = isDark && formLogo?.dark ? darkDirty : lightDirty;
		if (isExplicitlyCleared) return null;

		const fallback = isDark ? darkLogo || lightLogo : lightLogo;
		return fallback ? { src: fallback } : null;
	};

	const link: CatalogLink = {
		name: catalogName,
		description,
		title: catalogName,
		style: style,
		logo: null,
		group: null,
		order: 0,
		pathname: catalogName,
	};

	return (
		<Tabs onValueChange={(value) => setTheme(value as Theme)} value={theme}>
			<FieldLabel className="flex items-center justify-between">
				{t("forms.catalog-edit-props.props.preview.name")}
				<TabsList className="py-0 lg:h-8">
					<TabsTrigger className="text-xs px-2 py-1 gap-1" value={Theme.light}>
						<Icon icon="sun" />
						{t("theme.light")}
					</TabsTrigger>
					<TabsTrigger className="text-xs px-2 py-1 gap-1" value={Theme.dark}>
						<Icon icon="moon" />
						{t("theme.dark")}
					</TabsTrigger>
				</TabsList>
			</FieldLabel>
			<TabsContent value={theme}>
				<div
					className={cn(
						"bg-primary-bg flex items-center justify-center py-4 rounded-xl mt-4",
						theme === Theme.dark ? "dark" : "light",
					)}
					data-theme={theme}
				>
					<CardView
						brokenCloneFailed
						className="w-64"
						isReadOnly
						link={link}
						logo={getLogo()}
						name={catalogName}
					/>
				</div>
			</TabsContent>
		</Tabs>
	);
};
