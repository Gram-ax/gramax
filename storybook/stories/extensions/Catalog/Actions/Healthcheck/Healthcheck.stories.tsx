import ButtonLink from "@components/Molecules/ButtonLink";
import HealthcheckSource from "@ext/healthcheck/components/Healthcheck";
import t from "@ext/localization/locale/translate";
import { Meta } from "@storybook/react";

export default {
	title: "gx/extensions/Catalog/Actions/Healthcheck",
} as Meta<typeof Healthcheck>;

export const Healthcheck = () => {
	return <HealthcheckSource trigger={<ButtonLink iconCode="heart-pulse" text={t("healthcheck")} />} itemLinks={[]} />;
};
