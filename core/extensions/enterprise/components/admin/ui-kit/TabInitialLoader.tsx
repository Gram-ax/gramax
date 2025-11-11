import { Spinner } from "@ext/enterprise/components/admin/ui-kit/Spinner";

interface TabInitialLoaderProps {
	label?: string;
}

export function TabInitialLoader({ label }: TabInitialLoaderProps) {
	return (
		<div className="flex items-center justify-center h-screen">
			<div className="flex flex-col items-center gap-2">
				<Spinner size="xl" />
				{label && <span className="text-sm text-muted-foreground">{label}</span>}
			</div>
		</div>
	);
}
