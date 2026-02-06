import resolveModule from "@app/resolveModule/backend";

export const parseXml = (xml: string) => resolveModule("getDOMParser")().parseFromString(xml, "application/xml");

export const printXml = (node: Node) => resolveModule("getXMLSerializer")().serializeToString(node);
