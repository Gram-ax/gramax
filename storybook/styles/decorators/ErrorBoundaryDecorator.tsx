import ErrorBoundary from "@ext/errorHandlers/client/components/ErrorBoundary";

const ErrorBoundaryDecorator = (Story) => {
	return (
		<ErrorBoundary>
			<Story />
		</ErrorBoundary>
	);
};

export default ErrorBoundaryDecorator;
