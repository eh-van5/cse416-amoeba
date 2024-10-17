import { useTheme } from "../../ThemeContext";
import NetworkWidget from "../general/networkWidget/networkWidget";
import UploadFileWidget from "../general/uploadFileWidget";
import FileTable from "../tables/filesTable";

export default function FilesPage(){
    const {isDarkMode} = useTheme();

    return(
        <div className="page-content">
            <h1 style={{ color:isDarkMode ? 'white' : 'black'}}>Files</h1>
            <div id = "top-file-widgets">
                <UploadFileWidget />
                <NetworkWidget />
            </div>
            <FileTable />
        </div>
    )
}