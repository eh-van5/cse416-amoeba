import { useTheme } from "../../../ThemeContext";
import FilesTable from "../filesTable";

interface ClientUsageProps {
    items: clientUsageStructure[];
    headings: string[];
}

export default function ClientUsageTable({ items, headings }: ClientUsageProps) {
    const { isDarkMode } = useTheme();

    const formattedItems: JSX.Element[] = items.map((item) => {
        return (
            <div key={item.clientIP} className="items-table-row">
                <span className={`items-table-item${isDarkMode ? '-dark' : ''}`}>
                    {item.clientIP}
                </span>
                <span className={`items-table-item${isDarkMode ? '-dark' : ''}`}>
                    {item.dataTransferred} MB
                </span>
                <span className={`items-table-item${isDarkMode ? '-dark' : ''}`}>
                    {item.charge} AMB
                </span>
                <span className={`items-table-item${isDarkMode ? '-dark' : ''}`}>
                    {item.connectionTime}
                </span>
            </div>
        );
    });

    return (
        <FilesTable headings={headings} items={formattedItems} />
    );
}

export interface clientUsageStructure {
    clientIP: string;
    dataTransferred: number;
    charge: number;
    connectionTime: string;
}

export const clientUsageData = [
    { clientIP: "192.168.10.1", dataTransferred: 50, charge: 1.25, connectionTime: "10/15/2024, 2:30 PM" },
    { clientIP: "192.168.10.2", dataTransferred: 75, charge: 1.75, connectionTime: "10/16/2024, 11:45 AM" },
    { clientIP: "192.168.10.3", dataTransferred: 30, charge: 0.75, connectionTime: "10/16/2024, 9:20 AM" },
    { clientIP: "192.168.10.4", dataTransferred: 100, charge: 2.50, connectionTime: "10/17/2024, 6:00 PM" },
    { clientIP: "192.168.10.5", dataTransferred: 45, charge: 1.10, connectionTime: "10/18/2024, 8:10 PM" }
];