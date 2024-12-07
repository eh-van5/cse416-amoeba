import { useAppContext } from "../../../AppContext";
import FilesTable from "../filesTable";

interface TransactionProps {
    items: transactionStructure[];
    headings: string[];
}

export default function RecentTransactionsTable({ items, headings }: TransactionProps) {
    const { isDarkMode } = useAppContext();

    const formattedItems: JSX.Element[] = items.map((item) => {
        return (
            <div key={item.hash} className="items-table-row">
                <span className={`items-table-item${isDarkMode ? '-dark' : ''}`}>
                    {item.fileName}
                </span>
                <span className={`items-table-item${isDarkMode ? '-dark' : ''}`}>
                    {item.hash}
                </span>
                <span className={`items-table-item${isDarkMode ? '-dark' : ''}`}>
                    {item.status}
                </span>
                <span className={`items-table-item${isDarkMode ? '-dark' : ''}`}>
                    {item.amount} AMB
                </span>
                <span className={`items-table-item${isDarkMode ? '-dark' : ''}`}>
                    {item.date} {/* New Date column */}
                </span>
            </div>
        );
    });

    return (
        <FilesTable headings={headings} items={formattedItems} />
    );
}

export interface transactionStructure {
    fileName: string;
    hash: string;
    status: string;
    amount: number;
    date: string;
}

export const transactionData = [
    { fileName: "file1.pdf", hash: "abc123def456ghi789jkl012mno345pq", status: "Completed", amount: 1.50, date: "10/18/2024, 2:30 PM" },
    { fileName: "file2.png", hash: "def456ghi789jkl012mno345pqabc123d", status: "Pending", amount: 2.25, date: "10/18/2024, 3:00 PM" },
    { fileName: "file3.docx", hash: "ghi789jkl012mno345pqabc123def456g", status: "Failed", amount: 0.75, date: "10/17/2024, 9:45 AM" },
    { fileName: "file4.xls", hash: "jkl012mno345pqabc123def456ghi789j", status: "Completed", amount: -3.00, date: "10/16/2024, 6:10 PM" },
    { fileName: "file5.exe", hash: "mno345pqabc123def456ghi789jkl012m", status: "Completed", amount: -5.50, date: "10/16/2024, 12:30 PM" }
];