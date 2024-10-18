import { ReactElement, useState } from "react";
import { useTheme } from "../../ThemeContext";
import NetworkWidget from "../general/networkWidget/networkWidget";
import UploadFileWidget from "../general/uploadFileWidget";
import FileTable from "../tables/filesTable";
import PriceFilesWidget from "../general/priceFilesWidget/priceFilesWidget";

export interface UserFileData{
    file: File;
    price: number;
    shared: boolean;
}

export default function UserFilesPage(){
    const [sharedFiles, setSharedFiles] = useState<UserFileData[]>([]);
    const [uploadedFiles, setUploadedFiles] = useState<Map<string, UserFileData>>(new Map());
    const {isDarkMode} = useTheme();
    console.log(uploadedFiles);
    return(
        <div className="page-content">
            <h1 style={{ color:isDarkMode ? 'white' : 'black'}}>Files</h1>
            <div id = "top-file-widgets">
                <UploadFileWidget files = {uploadedFiles} setItems = {setUploadedFiles} />
                <PriceFilesWidget files = {uploadedFiles} setFiles = {setSharedFiles} />
            </div>
            <FileTable items={sharedFiles} />
        </div>
    )
}