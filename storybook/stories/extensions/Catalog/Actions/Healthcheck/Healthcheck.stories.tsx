import ListItem from "@components/Layouts/CatalogLayout/RightNavigation/ListItem";
import HealthcheckSource from "@ext/healthcheck/components/Healthcheck";
import { Meta } from "@storybook/react";
import useLocalize from "@ext/localization/useLocalize";

export default {
	title: "gx/extensions/Catalog/Actions/Healthcheck",
} as Meta<typeof Healthcheck>;

export const Healthcheck = () => {
	return <HealthcheckSource trigger={<ListItem iconCode="heart-pulse" text={useLocalize("healthcheck")} />} itemLinks={[]} />;
};
