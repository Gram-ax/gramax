import { useCatalogActionsContext } from "@components/Actions/CatalogActions/CatalogActionsContext";
import HealthcheckTrigger from "@ext/healthcheck/components/HealthcheckTrigger";
import IsReadOnlyHOC from "@core-ui/HigherOrderComponent/IsReadOnlyHOC";
import { ReactNode } from "react";

interface HealthcheckItemProps {
	children?: ReactNode;
}

const HealthcheckItem = ({ children }: HealthcheckItemProps) => {
	const { itemLinks } = useCatalogActionsContext();

	return (
		<IsReadOnlyHOC>
			<HealthcheckTrigger itemLinks={itemLinks}>{children}</HealthcheckTrigger>
		</IsReadOnlyHOC>
	);
};

export default HealthcheckItem;
