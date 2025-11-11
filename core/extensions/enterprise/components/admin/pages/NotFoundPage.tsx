import { SystemState, SystemStateTitle, SystemStateCode, SystemStateDescription } from "@ui-kit/SystemState";

const NotFoundPage = () => {
	return (
		<div className="flex items-center justify-center h-screen">
			<div className="w-full max-w-md">
				<SystemState>
					<SystemStateCode>404</SystemStateCode>
					<SystemStateTitle>Page Not Found</SystemStateTitle>
					<SystemStateDescription>
						The page you&apos;re looking for does not exist or has been moved
					</SystemStateDescription>
				</SystemState>
			</div>
		</div>
	);
};

export default NotFoundPage;
