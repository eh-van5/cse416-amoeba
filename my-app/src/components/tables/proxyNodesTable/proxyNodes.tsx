export interface proxyNodeStructure {
    ipAddress: string;
    pricePerMB: number;
    location: string;
    status: string;
}

export const proxyNodes = [
    { ipAddress: "192.168.1.1", pricePerMB: 0.1, location: "United States", status: "Free" },
    { ipAddress: "192.168.1.2", pricePerMB: 0.15, location: "Germany", status: "Free" },
    { ipAddress: "192.168.1.3", pricePerMB: 0.05, location: "Japan", status: "Busy" },
    { ipAddress: "192.168.1.4", pricePerMB: 0.02, location: "Korea", status: "Free" },
    { ipAddress: "192.168.1.5", pricePerMB: 0.04, location: "Canada", status: "Busy" }
];