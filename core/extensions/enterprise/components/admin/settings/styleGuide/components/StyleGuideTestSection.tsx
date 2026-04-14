import { Badge } from "@ui-kit/Badge";
import { Button } from "@ui-kit/Button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@ui-kit/Dropdown";
import { Icon } from "@ui-kit/Icon";
import { Label } from "@ui-kit/Label";
import { Loader } from "@ui-kit/Loader";
import { Popover, PopoverContent, PopoverTrigger } from "@ui-kit/Popover";
import { AutogrowTextarea } from "@ui-kit/Textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@ui-kit/Tooltip";
import type { RuleExample } from "../StyleGuideComponent";

interface TestSectionProps {
	testCases: RuleExample[];
	onAdd: (isCorrect: boolean) => void;
	onChange: (index: number, text: string) => void;
	onDelete: (index: number) => void;
	onRun: (index: number) => void;
	runningTests: Set<string>;
	testKeyPrefix: string;
	onRunAll?: () => void;
	isAnyTestRunning: boolean;
}

interface TestExampleGroupProps {
	title: string;
	isCorrect: boolean;
	testCases: RuleExample[];
	onAdd: () => void;
	onChange: (index: number, text: string) => void;
	onDelete: (index: number) => void;
	onRun: (index: number) => void;
	runningTests: Set<string>;
	testKeyPrefix: string;
	isAnyTestRunning: boolean;
}

interface TestExampleProps {
	index: number;
	example: RuleExample;
	onChange: (text: string) => void;
	onDelete: () => void;
	onRun: () => void;
	isRunning: boolean;
	isAnyTestRunning: boolean;
}

const TestSectionHeader = ({
	onRunAll,
	isAnyTestRunning,
	testCases,
}: {
	onRunAll?: () => void;
	isAnyTestRunning: boolean;
	testCases: RuleExample[];
}) => {
	const hasValidTests = testCases.some((tc) => tc.text?.trim());

	return (
		<div className="flex justify-between items-center mb-3">
			<h3 className="text-xl font-semibold">Тестирование</h3>
			<Button
				disabled={!onRunAll || isAnyTestRunning || !hasValidTests}
				onClick={onRunAll}
				size="sm"
				variant="outline"
			>
				<Icon className="mr-2" icon="fast-forward" size="md" />
				Запустить все
			</Button>
		</div>
	);
};

const TestExample = ({ index, example, onChange, onDelete, onRun, isRunning, isAnyTestRunning }: TestExampleProps) => {
	const badgeStatus = example.runResult?.statusCode === "success" ? "success" : "error";

	return (
		<div className="flex gap-2">
			<div className="flex gap-2 flex-1" style={{ alignItems: "baseline" }}>
				<Label className="font-semibold min-w-[2ch]">{index}.</Label>
				<AutogrowTextarea
					className="flex-1"
					minRows={1}
					onChange={(e) => onChange(e.target.value)}
					placeholder="Текст примера..."
					value={example.text}
				/>
			</div>

			<div className="flex gap-1" style={{ alignItems: "center", alignSelf: "flex-start" }}>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button disabled={isRunning || isAnyTestRunning} onClick={onRun} size="sm" variant="ghost">
							<Icon icon="play" size="md" />
						</Button>
					</TooltipTrigger>
					<TooltipContent>Запустить тест</TooltipContent>
				</Tooltip>

				{isRunning ? (
					<Loader />
				) : example.runResult ? (
					<Popover>
						<PopoverTrigger asChild>
							<button type="button">
								<Badge status={badgeStatus}>
									{badgeStatus === "success" ? (
										<Icon icon="check" size="md" />
									) : (
										<Icon icon="x" size="md" />
									)}
								</Badge>
							</button>
						</PopoverTrigger>
						<PopoverContent style={{ width: "100%", maxWidth: "850px" }}>
							<div className="grid gap-4">
								<h3 className="font-bold leading-none">Последний тест</h3>
								<div className="grid gap-2">
									<div className="grid grid-cols-3 gap-2" style={{ alignItems: "center" }}>
										<Label>
											Выполнено:{" "}
											{new Date(example.runResult.dateTimeIso8601).toLocaleString("ru-RU", {
												day: "2-digit",
												month: "2-digit",
												year: "numeric",
												hour: "2-digit",
												minute: "2-digit",
												second: "2-digit",
											})}
										</Label>
									</div>
									<Label>Ответ модели:</Label>
									<pre className="text-xs bg-muted p-2 mt-2 rounded-md overflow-x-auto">
										{JSON.stringify(example.runResult.result, null, 4)}
									</pre>
								</div>
							</div>
						</PopoverContent>
					</Popover>
				) : null}

				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button size="sm" variant="ghost">
							<Icon icon="ellipsis-vertical" size="md" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent>
						<DropdownMenuItem
							className="text-red-500 hover:!text-red-600"
							onClick={() => {
								const confirmed = confirm("Вы уверены, что хотите удалить тест?");
								if (confirmed) onDelete();
							}}
						>
							<Icon className="mr-2" icon="trash-2" size="md" />
							Удалить тест
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</div>
	);
};

const TestExampleGroup = ({
	title,
	isCorrect,
	testCases,
	onAdd,
	onChange,
	onDelete,
	onRun,
	runningTests,
	testKeyPrefix,
	isAnyTestRunning,
}: TestExampleGroupProps) => (
	<div className="space-y-2">
		<div className="flex items-center gap-2">
			<h4 className="text-lg font-semibold">{title}</h4>
			<Tooltip>
				<TooltipTrigger asChild>
					<Button onClick={onAdd} size="sm" variant="ghost">
						<Icon icon="plus" size="md" />
					</Button>
				</TooltipTrigger>
				<TooltipContent>Добавить тест</TooltipContent>
			</Tooltip>
		</div>
		<div className="space-y-2">
			{testCases
				.map((example, globalIndex) => ({ example, globalIndex }))
				.filter(({ example }) => example.isCorrect === isCorrect)
				.map(({ example, globalIndex }, displayIndex) => (
					<TestExample
						example={example}
						index={displayIndex + 1}
						isAnyTestRunning={isAnyTestRunning}
						isRunning={runningTests.has(`${testKeyPrefix}-${globalIndex}`)}
						key={globalIndex}
						onChange={(text) => onChange(globalIndex, text)}
						onDelete={() => onDelete(globalIndex)}
						onRun={() => onRun(globalIndex)}
					/>
				))}
		</div>
	</div>
);

export const TestSection = ({
	testCases,
	onAdd,
	onChange,
	onDelete,
	onRun,
	onRunAll,
	runningTests,
	testKeyPrefix,
	isAnyTestRunning,
}: TestSectionProps) => (
	<div className="mt-4 space-y-3">
		<TestSectionHeader isAnyTestRunning={isAnyTestRunning} onRunAll={onRunAll} testCases={testCases} />
		<TestExampleGroup
			isAnyTestRunning={isAnyTestRunning}
			isCorrect={false}
			onAdd={() => onAdd(false)}
			onChange={onChange}
			onDelete={onDelete}
			onRun={onRun}
			runningTests={runningTests}
			testCases={testCases}
			testKeyPrefix={testKeyPrefix}
			title="Предложения с ошибками"
		/>
		<TestExampleGroup
			isAnyTestRunning={isAnyTestRunning}
			isCorrect={true}
			onAdd={() => onAdd(true)}
			onChange={onChange}
			onDelete={onDelete}
			onRun={onRun}
			runningTests={runningTests}
			testCases={testCases}
			testKeyPrefix={testKeyPrefix}
			title="Предложения без ошибок"
		/>
	</div>
);
