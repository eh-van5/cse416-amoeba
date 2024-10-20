import { useTheme } from "../../../ThemeContext";
import FilesTable from "../filesTable";
import ProxySelectButton from "./proxySelectButton";
import { proxyNodeStructure } from "./proxyNodes";

interface ProxyTableProps {
    items: proxyNodeStructure[];
    headings: string[];
    onSelect: (selectedNode: proxyNodeStructure) => void; // A callback function to handle selection
}

export default function ProxyNodesTable({ items, headings, onSelect }: ProxyTableProps) {
    const { isDarkMode } = useTheme();

    const formattedItems: JSX.Element[] = items.map((item) => {
        return (
            <div key={item.ipAddress} className="items-table-row">
                <span className={`items-table-item${isDarkMode ? '-dark' : ''}`}>
                    {item.ipAddress}
                </span>
                <span className={`items-table-item${isDarkMode ? '-dark' : ''}`}>
                    {item.pricePerMB} AMB
                </span>
                <span className={`items-table-item${isDarkMode ? '-dark' : ''}`}>
                    {item.location}
                </span>
                <span className={`items-table-item${isDarkMode ? '-dark' : ''}`}>
                    {item.status}
                </span>
                <span className={`items-table-item${isDarkMode ? '-dark' : ''}`}>
                    <ProxySelectButton item={item} onSelect={onSelect} />
                </span>
            </div>
        );
    });

    return (
        <FilesTable headings={headings} items={formattedItems} />
    );
}
