export interface proxyNodeStructure {
    ipAddress: string;
    pricePerMB: number;
    location: string;
    status: string;
}

export const proxyNodes = [
    { ipAddress: "192.168.1.1", pricePerMB: 0.1, location: "United States", status: "Available" },
    { ipAddress: "192.168.1.2", pricePerMB: 0.15, location: "Germany", status: "Available" },
    { ipAddress: "192.168.1.3", pricePerMB: 0.05, location: "Japan", status: "Busy" }
];