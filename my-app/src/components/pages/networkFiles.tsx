import { ReactElement, useState } from "react";
import { useTheme } from "../../ThemeContext";
import NetworkWidget from "../general/networkWidget/networkWidget";
import UploadFileWidget from "../general/uploadFileWidget";
import FileTable from "../tables/userFilesTable/userFilesTable";
import NetworkFilesTable from "../tables/networkFilesTable/networkFiles";

interface FileMetadata {
    "Name" : string,
    "Size" : number, 
    "FileType": "string"
}

interface FileInfo {
    "Price": number, 
    "FileMeta": FileMetadata
}

export interface networkFileStructure {
    hostToFile: Map<string, FileInfo>
}
export default function NetworkFilesPage(){
    const headings = ["", "Name", "Size"];
    // pull items from backend
    const tempItems: networkFileStructure;
    const {isDarkMode} = useTheme();

    return(
        <div className="page-content">
            <div className="page-file-header"> 
                <p style={{ color:isDarkMode ? 'white' : 'black'}}>Network</p>
            </div>            
            <hr></hr>
            <br></br>
            <div id = "top-widgets">
                <NetworkWidget />
            </div>
            <br></br>
            <hr></hr>
            <div className="page-file-header"> 
                <p style={{ color:isDarkMode ? 'white' : 'black'}}>Network Files</p>
            </div>
            <NetworkFilesTable items={tempItems} headings={headings}/>
        </div>
    )
}