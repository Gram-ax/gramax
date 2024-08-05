import ButtonsLayout from "@components/Layouts/ButtonLayout";
import t from "@ext/localization/locale/translate";
import Button from "@ext/markdown/core/edit/components/Menu/Button";
import SvgContainer from "@ext/markdown/core/edit/components/Menu/SvgContainer";
import { Editor } from "@tiptap/core";
import { columnIsHeader, rowIsHeader, selectedRect, TableRect } from "prosemirror-tables";

const Table = ({ editor }: { editor?: Editor; className?: string }) => {
	const focusIsTable = editor?.isActive("table");
	const tableRect: TableRect = focusIsTable ? selectedRect(editor.state) : ({} as any);
	const isHeaderRow = rowIsHeader(tableRect.map, tableRect.table, 0);
	const isHeaderColumn = columnIsHeader(tableRect.map, tableRect.table, 0);
	return (
		<ButtonsLayout>
			<Button
				onClick={() => {
					isHeaderRow
						? editor.chain().focus().toggleHeaderRow().addRowBefore().toggleHeaderRow().run()
						: editor.chain().focus().addRowBefore().run();
				}}
				disabled={editor ? !editor.can().addRowBefore() : false}
				useSvgDefaultWidth={false}
				tooltipText={t("editor.table.row.add-up")}
			>
				<SvgContainer>
					<svg
						width="1rem"
						height="1rem"
						viewBox="-1.5 -1.5 15 15"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							fillRule="evenodd"
							clipRule="evenodd"
							d="M3 6C2.20435 6 1.44129 5.68393 0.878679 5.12132C0.31607 4.55871 0 3.79565 0 3C0 2.20435 0.31607 1.44129 0.87868 0.87868C1.44129 0.316071 2.20435 0 3 0C3.79565 0 4.55871 0.316071 5.12132 0.87868C5.68393 1.44129 6 2.20435 6 3C6 3.79565 5.68393 4.55871 5.12132 5.12132C4.55871 5.68393 3.79565 6 3 6ZM2.55 2.55003L2.55 1.19995L3.45 1.19995L3.45 2.55003L4.79995 2.55003V3.45003L3.45 3.45003V4.79995H2.55L2.55 3.45003H1.19995L1.19995 2.55003H2.55Z"
							fill="currentColor"
						/>
						<path
							fillRule="evenodd"
							clipRule="evenodd"
							d="M0.9 7.19993L11.1 7.19993V4.29993C11.1 4.2447 11.0552 4.19993 11 4.19993L6.81579 4.19993C6.90722 3.9092 6.96565 3.60733 6.98875 3.29993H11C11.5523 3.29993 12 3.74764 12 4.29993V11C12 11.5522 11.5523 12 11 12L1 12C0.447715 12 0 11.5522 0 11V5.64577C0.0551093 5.70826 0.112315 5.76918 0.171573 5.82844C0.393011 6.04988 0.637739 6.24267 0.9 6.40444L0.9 7.19993ZM11 11.1H1C0.944771 11.1 0.9 11.0552 0.9 11L0.9 8.09995H11.1V11C11.1 11.0552 11.0552 11.1 11 11.1Z"
							fill="currentColor"
						/>
					</svg>
				</SvgContainer>
			</Button>
			<Button
				onClick={() => editor.chain().focus().addRowAfter().run()}
				disabled={editor ? !editor.can().addRowAfter() : false}
				useSvgDefaultWidth={false}
				tooltipText={t("editor.table.row.add-down")}
			>
				<SvgContainer>
					<svg
						width="1rem"
						height="1rem"
						viewBox="-1.5 -1.5 15 15"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							fillRule="evenodd"
							clipRule="evenodd"
							d="M0 0.999999C0 0.447715 0.447715 0 1 0H11C11.5523 0 12 0.447715 12 1V7.70003C12 8.25231 11.5523 8.70002 11 8.70002H6.98875C6.96565 8.39262 6.90722 8.09075 6.81579 7.80002H11C11.0552 7.80002 11.1 7.75525 11.1 7.70003V4.80002H0.9V5.59551C0.637739 5.75728 0.393011 5.95007 0.171573 6.17151C0.112315 6.23077 0.0551093 6.29169 0 6.35418V0.999999ZM1 0.9H11C11.0552 0.9 11.1 0.944771 11.1 1V3.9H0.9V0.999999C0.9 0.944772 0.944771 0.9 1 0.9Z"
							fill="currentColor"
						/>
						<path
							fillRule="evenodd"
							clipRule="evenodd"
							d="M3 6C2.20435 6 1.44129 6.31607 0.87868 6.87868C0.31607 7.44129 0 8.20435 0 9C0 9.79565 0.31607 10.5587 0.87868 11.1213C1.44129 11.6839 2.20435 12 3 12C3.79565 12 4.55871 11.6839 5.12132 11.1213C5.68393 10.5587 6 9.79565 6 9C6 8.20435 5.68393 7.44129 5.12132 6.87868C4.55871 6.31607 3.79565 6 3 6ZM2.55 9.44987V10.7999H3.45V9.44987H4.79995V8.54988H3.45V7.19995H2.55V8.54988H1.19995V9.44987H2.55Z"
							fill="currentColor"
						/>
					</svg>
				</SvgContainer>
			</Button>
			<Button
				onClick={() => {
					isHeaderColumn
						? editor.chain().focus().toggleHeaderColumn().addColumnBefore().toggleHeaderColumn().run()
						: editor.chain().focus().addColumnBefore().run();
				}}
				disabled={editor ? !editor.can().addColumnBefore() : false}
				useSvgDefaultWidth={false}
				tooltipText={t("editor.table.row.add-left")}
			>
				<SvgContainer>
					<svg
						width="1rem"
						height="1rem"
						viewBox="-1.5 -1.5 15 15"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							fillRule="evenodd"
							clipRule="evenodd"
							d="M6 3C6 2.20435 5.68393 1.44129 5.12132 0.87868C4.55871 0.316071 3.79565 0 3 0C2.20435 0 1.44129 0.316071 0.87868 0.87868C0.31607 1.44129 0 2.20435 0 3C0 3.79565 0.31607 4.55871 0.878679 5.12132C1.44129 5.68393 2.20435 6 3 6C3.79565 6 4.55871 5.68393 5.12132 5.12132C5.68393 4.55871 6 3.79565 6 3ZM2.55012 2.55L1.20005 2.55L1.20005 3.45L2.55012 3.45L2.55012 4.79995H3.45012L3.45012 3.45H4.80005V2.55L3.45012 2.55V1.19995L2.55012 1.19995V2.55Z"
							fill="currentColor"
						/>
						<path
							fillRule="evenodd"
							clipRule="evenodd"
							d="M4.30005 11.1H7.19995L7.19995 0.9L6.40438 0.9C6.24261 0.637739 6.04982 0.393011 5.82838 0.171573C5.76912 0.112316 5.7082 0.0551092 5.64571 0H11C11.5522 0 12 0.447715 12 1L12 11C12 11.5523 11.5522 12 11 12H4.30005C3.74776 12 3.30005 11.5523 3.30005 11V6.98874C3.60745 6.96562 3.90932 6.90718 4.20005 6.81573V11C4.20005 11.0552 4.24482 11.1 4.30005 11.1ZM11 11.1H8.10005L8.10005 0.9L11 0.9C11.0552 0.9 11.1 0.944771 11.1 1L11.1 11C11.1 11.0552 11.0552 11.1 11 11.1Z"
							fill="currentColor"
						/>
					</svg>
				</SvgContainer>
			</Button>
			<Button
				onClick={() => editor.chain().focus().addColumnAfter().run()}
				disabled={editor ? !editor.can().addColumnAfter() : false}
				useSvgDefaultWidth={false}
				tooltipText={t("editor.table.row.add-right")}
			>
				<SvgContainer>
					<svg
						width="1rem"
						height="1rem"
						viewBox="-3 -1.5 15 15"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							fillRule="evenodd"
							clipRule="evenodd"
							d="M6.17157 0.171573C6.23083 0.112316 6.29176 0.0551092 6.35424 0H0.999999C0.447715 0 0 0.447715 0 1V11C0 11.5523 0.447716 12 1 12H7.6999C8.25219 12 8.6999 11.5523 8.6999 11L8.6999 6.98874C8.3925 6.96562 8.09063 6.90718 7.7999 6.81573V11C7.7999 11.0552 7.75513 11.1 7.6999 11.1H4.8L4.8 0.9L5.59557 0.9C5.75734 0.637739 5.95013 0.393011 6.17157 0.171573ZM0.9 11L0.9 1C0.9 0.944771 0.944772 0.9 0.999999 0.9L3.8999 0.9L3.8999 11.1H1C0.944772 11.1 0.9 11.0552 0.9 11Z"
							fill="currentColor"
						/>
						<path
							fillRule="evenodd"
							clipRule="evenodd"
							d="M6 3C6 2.20435 6.31607 1.44129 6.87868 0.87868C7.44129 0.316071 8.20435 0 9 0C9.79565 0 10.5587 0.316071 11.1213 0.87868C11.6839 1.44129 12 2.20435 12 3C12 3.79565 11.6839 4.55871 11.1213 5.12132C10.5587 5.68393 9.79565 6 9 6C8.20435 6 7.44129 5.68393 6.87868 5.12132C6.31607 4.55871 6 3.79565 6 3ZM9.44987 2.55L10.7999 2.55V3.45L9.44987 3.45L9.44988 4.79995H8.54988V3.45H7.19995V2.55L8.54988 2.55V1.19995L9.44987 1.19995V2.55Z"
							fill="currentColor"
						/>
					</svg>
				</SvgContainer>
			</Button>
			<Button
				onClick={() => editor.chain().focus().deleteRow().run()}
				disabled={editor ? !editor.can().deleteRow() : false}
				useSvgDefaultWidth={false}
				tooltipText={t("editor.table.row.delete")}
			>
				<SvgContainer>
					<svg
						width="1rem"
						height="1rem"
						viewBox="-1.5 -1.5 15 15"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							fillRule="evenodd"
							clipRule="evenodd"
							d="M0.954594 0.696743C0.778858 0.521007 0.493934 0.521007 0.318198 0.696743C0.142462 0.872479 0.142462 1.1574 0.318198 1.33314L2.9032 3.91814H1C0.447715 3.91814 0 4.36585 0 4.91814V7.71814C0 8.27042 0.447715 8.71814 1 8.71814H7.7032L10.2884 11.3033C10.4641 11.4791 10.7491 11.4791 10.9248 11.3033C11.1005 11.1276 11.1005 10.8427 10.9248 10.6669L0.954594 0.696743ZM6.8032 7.81814L3.8032 4.81814H1C0.944771 4.81814 0.9 4.86291 0.9 4.91814V7.71814C0.9 7.77337 0.944772 7.81814 1 7.81814H6.8032Z"
							fill="currentColor"
						/>
						<path
							d="M11 7.81814H9.31745L10.2174 8.71814H11C11.5523 8.71814 12 8.27042 12 7.71814V4.91814C12 4.36585 11.5523 3.91814 11 3.91814H5.41745L6.31745 4.81814H11C11.0552 4.81814 11.1 4.86291 11.1 4.91814V7.71814C11.1 7.77337 11.0552 7.81814 11 7.81814Z"
							fill="currentColor"
						/>
					</svg>
				</SvgContainer>
			</Button>
			<Button
				onClick={() => editor.chain().focus().deleteColumn().run()}
				disabled={editor ? !editor.can().deleteColumn() : false}
				useSvgDefaultWidth={false}
				tooltipText={t("editor.table.column.delete")}
			>
				<SvgContainer>
					<svg
						width="1rem"
						height="1rem"
						viewBox="-1.25 -1.5 15 15"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							fillRule="evenodd"
							clipRule="evenodd"
							d="M8.7784 9.09663V11C8.7784 11.5523 8.33068 12 7.7784 12H4.9784C4.42611 12 3.9784 11.5523 3.9784 11V4.29663L0.696743 1.01498C0.521007 0.839239 0.521007 0.554315 0.696743 0.378579C0.872479 0.202843 1.1574 0.202843 1.33314 0.378579L11.3033 10.3488C11.4791 10.5245 11.4791 10.8094 11.3033 10.9852C11.1276 11.1609 10.8427 11.1609 10.6669 10.9852L8.7784 9.09663ZM7.8784 8.19663V11C7.8784 11.0552 7.83363 11.1 7.7784 11.1H4.9784C4.92317 11.1 4.8784 11.0552 4.8784 11L4.8784 5.19663L7.8784 8.19663Z"
							fill="currentColor"
						/>
						<path
							d="M8.7784 6.58243L7.8784 5.68243L7.8784 1C7.8784 0.944771 7.83363 0.9 7.7784 0.9L4.9784 0.9C4.92317 0.9 4.8784 0.944771 4.8784 1V2.68243L3.9784 1.78243V1C3.9784 0.447715 4.42611 0 4.9784 0H7.7784C8.33068 0 8.7784 0.447715 8.7784 1L8.7784 6.58243Z"
							fill="currentColor"
						/>
					</svg>
				</SvgContainer>
			</Button>
			<Button
				onClick={() => editor.chain().focus().toggleHeaderRow().run()}
				disabled={editor ? !editor.can().toggleHeaderRow() : false}
				useSvgDefaultWidth={false}
				tooltipText={t("editor.table.row.title")}
				isActive={editor ? isHeaderRow : false}
			>
				<SvgContainer>
					<svg
						width="1rem"
						height="1rem"
						viewBox="-1.5 -1.5 15 15"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							fillRule="evenodd"
							clipRule="evenodd"
							d="M12 10.25C12 10.8023 11.5523 11.25 11 11.25H1C0.447715 11.25 0 10.8023 0 10.25V1.75C0 1.68096 0.00699555 1.61356 0.0203164 1.54847C0.0402978 1.45082 0.0745112 1.35836 0.120695 1.27334C0.198134 1.13079 0.309229 1.00917 0.443314 0.919152C0.602438 0.812325 0.793941 0.75 1 0.75H11C11.5523 0.75 12 1.19772 12 1.75V10.25ZM5.55 4.55V10.35H1C0.944772 10.35 0.9 10.3052 0.9 10.25V4.55H5.55ZM6.45 4.55V10.35H11C11.0552 10.35 11.1 10.3052 11.1 10.25V4.55H6.45Z"
							fill="currentColor"
						/>
					</svg>
				</SvgContainer>
			</Button>
			<Button
				onClick={() => editor.chain().focus().toggleHeaderColumn().run()}
				disabled={editor ? !editor.can().toggleHeaderColumn() : false}
				useSvgDefaultWidth={false}
				tooltipText={t("editor.table.column.title")}
				isActive={editor ? isHeaderColumn : false}
			>
				<SvgContainer>
					<svg
						width="1rem"
						height="1rem"
						viewBox="-1.5 -1.5 15 15"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							fillRule="evenodd"
							clipRule="evenodd"
							d="M11 0.75C11.5523 0.75 12 1.19772 12 1.75V10.25C12 10.8023 11.5523 11.25 11 11.25L1 11.25C0.447715 11.25 0 10.8023 0 10.25V1.75C0 1.19771 0.447715 0.75 0.999999 0.75H11ZM3.8 6.45L11.1 6.45V10.25C11.1 10.3052 11.0552 10.35 11 10.35L3.8 10.35L3.8 6.45ZM3.8 5.55L11.1 5.55V1.75C11.1 1.69477 11.0552 1.65 11 1.65L3.8 1.65L3.8 5.55Z"
							fill="currentColor"
						/>
					</svg>
				</SvgContainer>
			</Button>
			<Button
				onClick={() => editor.chain().focus().mergeCells().run()}
				disabled={editor ? !editor.can().mergeCells() : false}
				useSvgDefaultWidth={false}
				tooltipText={t("editor.table.join-cells")}
			>
				<SvgContainer>
					<svg
						width="1rem"
						height="1rem"
						viewBox="-1.5 -1.5 15 15"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M1.42456 10.35H4.22456C4.27979 10.35 4.32456 10.3052 4.32456 10.25V9.5H5.22456V10.25C5.22456 10.8023 4.77685 11.25 4.22456 11.25H1.42456C0.872275 11.25 0.424561 10.8023 0.424561 10.25V1.75C0.424561 1.19772 0.872276 0.75 1.42456 0.75H4.22456C4.77685 0.75 5.22456 1.19772 5.22456 1.75V2.5H4.32456V1.75C4.32456 1.69477 4.27979 1.65 4.22456 1.65L1.42456 1.65C1.36933 1.65 1.32456 1.69477 1.32456 1.75L1.32456 5.55237H2.57637L2.56242 3.75121C2.56242 3.67966 2.64527 3.64011 2.69988 3.68342L5.5432 5.93361C5.58651 5.9675 5.58651 6.0334 5.5432 6.0673L2.69988 8.3156C2.64339 8.36079 2.56242 8.31936 2.56242 8.24781V6.44526H1.32456L1.32456 10.25C1.32456 10.3052 1.36933 10.35 1.42456 10.35Z"
							fill="currentColor"
						/>
						<path
							d="M7.77544 1.65L10.5754 1.65C10.6307 1.65 10.6754 1.69477 10.6754 1.75V5.55474H9.43758V3.75219C9.43758 3.68064 9.35661 3.63921 9.30012 3.6844L6.4568 5.9327C6.41349 5.9666 6.41349 6.0325 6.4568 6.06639L9.30012 8.31658C9.35473 8.35989 9.43758 8.32034 9.43758 8.24879L9.42363 6.44763H10.6754V10.25C10.6754 10.3052 10.6307 10.35 10.5754 10.35H7.77544C7.72021 10.35 7.67544 10.3052 7.67544 10.25V9.5H6.77544V10.25C6.77544 10.8023 7.22315 11.25 7.77544 11.25H10.5754C11.1277 11.25 11.5754 10.8023 11.5754 10.25L11.5754 1.75C11.5754 1.19772 11.1277 0.75 10.5754 0.75L7.77544 0.75C7.22315 0.75 6.77544 1.19772 6.77544 1.75V2.5L7.67544 2.5V1.75C7.67544 1.69477 7.72021 1.65 7.77544 1.65Z"
							fill="currentColor"
						/>
					</svg>
				</SvgContainer>
			</Button>
			<Button
				onClick={() => editor.chain().focus().splitCell().run()}
				disabled={editor ? !editor.can().splitCell() : false}
				useSvgDefaultWidth={false}
				tooltipText={t("editor.table.split-cells")}
			>
				<SvgContainer>
					<svg
						width="1rem"
						height="1rem"
						viewBox="-1 -1.5 15 15"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M7.84888 10.35H10.6489C10.7041 10.35 10.7489 10.3052 10.7489 10.25V9.5H11.6489V10.25C11.6489 10.8023 11.2012 11.25 10.6489 11.25H7.84888C7.29659 11.25 6.84888 10.8023 6.84888 10.25V1.75C6.84888 1.19772 7.29659 0.75 7.84888 0.75H10.6489C11.2012 0.75 11.6489 1.19772 11.6489 1.75V2.5H10.7489V1.75C10.7489 1.69477 10.7041 1.65 10.6489 1.65L7.84888 1.65C7.79365 1.65 7.74888 1.69477 7.74888 1.75V5.55237H9.00068L8.98673 3.75121C8.98673 3.67966 9.06958 3.64011 9.12419 3.68342L11.9675 5.93361C12.0108 5.9675 12.0108 6.0334 11.9675 6.0673L9.12419 8.3156C9.0677 8.36079 8.98673 8.31936 8.98673 8.24781V6.44526H7.74888L7.74888 10.25C7.74888 10.3052 7.79365 10.35 7.84888 10.35Z"
							fill="currentColor"
						/>
						<path
							d="M1.35112 1.65L4.15112 1.65C4.20635 1.65 4.25112 1.69477 4.25112 1.75L4.25112 5.55462H3.01327L3.01327 3.75207C3.01327 3.68051 2.9323 3.63909 2.87581 3.68428L0.0324817 5.93258C-0.0108272 5.96647 -0.0108272 6.03238 0.0324817 6.06627L2.87581 8.31645C2.93042 8.35976 3.01327 8.32022 3.01327 8.24867L2.99932 6.44751H4.25112V10.25C4.25112 10.3052 4.20635 10.35 4.15112 10.35H1.35112C1.29589 10.35 1.25112 10.3052 1.25112 10.25V9.5H0.351123L0.351123 10.25C0.351123 10.8023 0.798838 11.25 1.35112 11.25H4.15112C4.70341 11.25 5.15112 10.8023 5.15112 10.25L5.15112 1.75C5.15112 1.19772 4.70341 0.75 4.15112 0.75L1.35112 0.75C0.798838 0.75 0.351122 1.19772 0.351122 1.75L0.351122 2.5L1.25112 2.5L1.25112 1.75C1.25112 1.69477 1.29589 1.65 1.35112 1.65Z"
							fill="currentColor"
						/>
					</svg>
				</SvgContainer>
			</Button>
			<Button
				onClick={() => editor.chain().focus().deleteTable().run()}
				disabled={editor ? !editor.can().deleteTable() : false}
				icon={"trash"}
				tooltipText={t("delete")}
			/>
		</ButtonsLayout>
	);
};

export default Table;
