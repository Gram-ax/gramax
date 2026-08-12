import t from "@ext/localization/locale/translate";
import type { LogScope } from "@ext/loggers/opentelemetry/exporters/indexed-db";
import { exportLogs } from "@ext/loggers/opentelemetry/exportLogs";
import { Button } from "@ui-kit/Button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@ui-kit/Dropdown";
import { Icon } from "@ui-kit/Icon";
import type { ComponentProps } from "react";

const SCOPES: { scope: LogScope; labelKey: Parameters<typeof t>[0] }[] = [
	{ scope: "session", labelKey: "export-logs.session" },
	{ scope: "today", labelKey: "export-logs.today" },
	{ scope: "7d", labelKey: "export-logs.last-7-days" },
	{ scope: "all", labelKey: "export-logs.all" },
];

const ExportLogsButton = (props: ComponentProps<typeof Button>) => {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button aria-label={t("export-logs.title")} variant="outline" {...props}>
					<Icon icon="download" />
					{t("export-logs.title")}
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="center" className="w-[var(--radix-dropdown-menu-trigger-width)]">
				{SCOPES.map(({ scope, labelKey }) => (
					<DropdownMenuItem key={scope} onClick={() => void exportLogs(scope)}>
						{t(labelKey)}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

export default ExportLogsButton;
