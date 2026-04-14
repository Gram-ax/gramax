const getStringByteSize = (str: string) => (str ? new TextEncoder().encode(str).length : 0);

export default getStringByteSize;
