import { Loader } from "ics-ui-kit/components/loader";
import { useEffect, useState } from "react";

const HEALTH_TIMEOUT_MS = 10000;

interface UseHealthCheckProps {
	healthcheckDataProvider: () => Promise<boolean>;
}

export const useHealthCheck = ({ healthcheckDataProvider }: UseHealthCheckProps) => {
	const [isHealthy, setIsHealthy] = useState<boolean | undefined>(undefined);

	useEffect(() => {
		const timeoutPromise = new Promise<boolean>((resolve) => {
			setTimeout(() => resolve(false), HEALTH_TIMEOUT_MS);
		});

		void Promise.race([healthcheckDataProvider(), timeoutPromise]).then(setIsHealthy);
	}, [healthcheckDataProvider]);

	const healthCheckLoader =
		isHealthy === undefined ? (
			<div className="flex items-center justify-center h-full">
				<Loader style={{ transform: "scale(3)" }} />
			</div>
		) : null;

	return { isHealthy, healthCheckLoader };
};
