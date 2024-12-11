import { useAppContext } from "../../../AppContext";
import FilesTable from "../filesTable";
import NetworkBuyButton from "./networkBuyButton";
import { formatBytes, translateDate } from "../../general/formatHelpers";
import { useEffect, useState } from "react";
import { FileInfo } from "../../types";

interface FileTableProps {
    headings: string[];
    setHostToFile: React.Dispatch<React.SetStateAction<{} | Record<string, FileInfo>>>;
    k: number;
}

export default function NetworkFilesTable ({headings, setHostToFile, k} : FileTableProps) {
    // console.log(items)
    const {isDarkMode} = useAppContext();
    const [items, setItems] = useState<FileInfo[]>([])
    useEffect(() => {
        const queryKNeighbors = async () => {
            const PORT = 8088;
            const response = await fetch(`http://localhost:${PORT}/exploreKNeighbors?K=${k}`, {
                method: 'GET',
            });
            if (response.ok) { 
                const files = await response.json();
                setItems(files)
            } else {
                alert("Error fetching user files.");
            }
        } 
        queryKNeighbors()
    }, [k, setItems])
    // pull actual items from backend

    const formattedItems: JSX.Element[] = items.map((item:FileInfo) => {
        // const status = item.shared ? "sharing" : "not sharing"
        return (
        <div key = {item.Name} className = "items-table-row">

            <span className={`items-table-item${isDarkMode ? '-dark' : ''}`}>
                <NetworkBuyButton item = {item} setHostToFile = {setHostToFile} />
            </span>
            <span className={`items-table-item${isDarkMode ? '-dark' : ''}`}>
                {item.Name}
            </span>
            <span className={`items-table-item${isDarkMode ? '-dark' : ''}`}>
                {translateDate(item.LastModified)}
            </span>
            <span className={`items-table-item${isDarkMode ? '-dark' : ''}`}>
                {formatBytes(item.Size)}
            </span>
        </div>
        )
    })

    return (
        <div id = "filesTable" className={`items-table${isDarkMode? '-dark' : ''}`}>
            <FilesTable headings={headings} items={formattedItems} />
        </div>
    )
}

