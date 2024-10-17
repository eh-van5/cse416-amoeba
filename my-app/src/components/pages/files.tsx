import { useTheme } from "../../ThemeContext";
import FileTable from "../tables/filesTable";

export default function FilesPage(){
    const {isDarkMode} = useTheme();

    return(
        <div className="page-content">
            <h1 style={{ color:isDarkMode ? 'white' : 'black'}}>Files</h1>
            <FileTable />
        </div>
    )
}