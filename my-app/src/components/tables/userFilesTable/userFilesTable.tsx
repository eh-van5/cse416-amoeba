import { useAppContext } from "../../../AppContext";
import FilesTable from "../filesTable";
import { UserFileData } from "../../pages/userFiles";
import StatusButton from "./userFilesTableButton";
import { formatBytes, translateDate } from "../../general/formatHelpers";

interface FileTableProps {
    items: UserFileData[]
    setItems: React.Dispatch<React.SetStateAction<UserFileData[]>>;
    headings: string[]
}


export default function UserFilesTable ({items, setItems, headings} : FileTableProps) {
    // console.log(items)
    const {isDarkMode} = useAppContext();

    const formattedItems: JSX.Element[] = items.map((item) => {
        // if (!item.shared) {
        //     return <></>;
        // }
        // const status = item.shared ? "sharing" : "not sharing"
        return (
        <div key = {item.Name} className = "items-table-row">

            <span className={`items-table-item${isDarkMode ? '-dark' : ''}`}>
                <StatusButton item = {item} items = {items} setItems={setItems} />
            </span>
            <span className={`items-table-item${isDarkMode ? '-dark' : ''}`}>
                {item.Name}
            </span>
            <span className={`items-table-item${isDarkMode ? '-dark' : ''}`}>
                {item.Price}
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

