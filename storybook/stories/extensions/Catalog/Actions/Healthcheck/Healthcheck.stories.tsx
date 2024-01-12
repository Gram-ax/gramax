import HealthcheckSource from "@ext/healthcheck/components/Healthcheck";
import { Meta } from "@storybook/react";

export default {
	title: "gx/extensions/Catalog/Actions/Healthcheck",
} as Meta<typeof Healthcheck>;

export const Healthcheck = () => {
	return <HealthcheckSource itemLinks={[]} />;
};
