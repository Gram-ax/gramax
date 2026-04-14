import type PageDataContext from "@core/Context/PageDataContext";
import { usePlatform } from "@core-ui/hooks/usePlatform";
import BugsnagErrorBoundary from "@ext/bugsnag/components/BugsnagErrorBoundary";
import OnNetworkApiErrorService from "@ext/errorHandlers/client/OnNetworkApiErrorService";
import ErrorConfirmService from "../ErrorConfirmService";

export type ErrorBoundaryProps = { context?: PageDataContext; children: JSX.Element };

const ErrorBoundary = ({ context, children }: ErrorBoundaryProps) => {
	const { environment } = usePlatform();
	const services = (
		<ErrorConfirmService.Provider>
			<OnNetworkApiErrorService.Provider>{children}</OnNetworkApiErrorService.Provider>
		</ErrorConfirmService.Provider>
	);
	if (!context?.conf?.isProduction) return services;

	return (
		<BugsnagErrorBoundary context={context} environment={environment}>
			{services}
		</BugsnagErrorBoundary>
	);
};

export default ErrorBoundary;
