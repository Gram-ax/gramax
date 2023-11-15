import HealthcheckSource from "@ext/healthcheck/components/Healthcheck";
import { ComponentMeta } from "@storybook/react";
import mockApi from "../../../../../logic/api/mockApi";
import apiData from "./apiData.json";

export default {
	title: "DocReader/extensions/Catalog/Actions/Healthcheck",
	parameters: {
		msw: mockApi([{ path: "/api/healthcheck/:catalog", response: apiData, delay: 1000 }]),
	},
} as ComponentMeta<typeof Healthcheck>;

export const Healthcheck = () => {
	return <HealthcheckSource itemLinks={[]} />;
};
