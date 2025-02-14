const table = { block: "table", getAttrs: (tok) => tok.attrs };

const tableRow = { block: "tableRow", getAttrs: (tok) => tok.attrs };

const tableCell = { block: "tableCell", getAttrs: (tok) => tok.attrs };

const tableHeader = { block: "tableHeader", getAttrs: (tok) => tok.attrs };

export default { table, tableRow, tableCell, tableHeader };
