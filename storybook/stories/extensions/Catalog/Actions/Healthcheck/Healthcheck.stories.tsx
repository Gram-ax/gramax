import ListItem from "@components/Layouts/CatalogLayout/RightNavigation/ListItem";
import HealthcheckSource from "@ext/healthcheck/components/Healthcheck";
import t from "@ext/localization/locale/translate";
import { Meta } from "@storybook/react";

export default {
	title: "gx/extensions/Catalog/Actions/Healthcheck",
} as Meta<typeof Healthcheck>;

export const Healthcheck = () => {
	return <HealthcheckSource trigger={<ListItem iconCode="heart-pulse" text={t("healthcheck")} />} itemLinks={[]} />;
};
