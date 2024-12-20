export function parseLogData(data: string): string[] {
    const dataTrimmed = data.startsWith("0x") ? data.substring(2) : data;
    const matchedData = dataTrimmed.match(/.{1,64}/g);
    return (matchedData || []).map(x => `0x${x}`);
}
