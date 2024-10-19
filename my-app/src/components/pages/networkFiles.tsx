import { ReactElement, useState } from "react";
import { useTheme } from "../../ThemeContext";
import NetworkWidget from "../general/networkWidget/networkWidget";
import UploadFileWidget from "../general/uploadFileWidget";
import FileTable from "../tables/userFilesTable/userFilesTable";
import NetworkFilesTable from "../tables/networkFilesTable/networkFiles";

export interface networkFileStructure {
    file: {
        "name": string,
        "lastModified": number,
        "size": number
    }
    prices: Map<string, number>
}
export default function NetworkFilesPage(){
    const headings = ["", "Name", "Last Modified", "Size"];
    // pull items from backend
    const tempItems: networkFileStructure[] = [
        { 
            file: {
                name: "file name",
                lastModified: 123456789,
                size: 0
            },
            prices: new Map<string, number>().set('owner1', 10000000000).set('owner2', 20)
        }
    ]
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