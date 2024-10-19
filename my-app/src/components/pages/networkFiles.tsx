import { ReactElement, useState } from "react";
import { useTheme } from "../../ThemeContext";
import NetworkWidget from "../general/networkWidget/networkWidget";
import UploadFileWidget from "../general/uploadFileWidget";
import FileTable from "../tables/userFilesTable/userFilesTable";

export default function NetworkFilesPage(){
    const headings = ["Name", "Shared By", "Last Opened", "Status", "Size"];
    const [items, setItems] = useState<ReactElement[]>([]);
    const {isDarkMode} = useTheme();

    return(
        <div className="page-content">
            <p style={{ color:isDarkMode ? 'white' : 'black'}}>Network</p>
            <hr></hr>
            <div id = "top-widgets">
                <NetworkWidget />
            </div>
            <p style={{ color:isDarkMode ? 'white' : 'black'}}>Network Files</p>
            <hr></hr>
        </div>
    )
}