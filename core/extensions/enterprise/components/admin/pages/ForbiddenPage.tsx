import { SystemState, SystemStateCode, SystemStateDescription, SystemStateTitle } from "@ui-kit/SystemState";

const ForbiddenPage = () => {
	return (
		<div className="flex items-center justify-center h-screen">
			<div className="w-full max-w-md">
				<SystemState>
					<SystemStateCode>403</SystemStateCode>
					<SystemStateTitle>Доступ запрещен</SystemStateTitle>
					<SystemStateDescription>У вас нет доступа к этой странице</SystemStateDescription>
				</SystemState>
			</div>
		</div>
	);
};

export default ForbiddenPage;
