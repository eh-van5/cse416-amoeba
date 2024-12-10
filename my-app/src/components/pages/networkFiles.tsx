import { ReactElement, useState } from "react";
import { useAppContext } from "../../AppContext";
import NetworkWidget from "../general/networkWidget/networkWidget";
import UploadFileWidget from "../general/uploadFileWidget";
import FileTable from "../tables/userFilesTable/userFilesTable";
import NetworkFilesTable from "../tables/networkFilesTable/networkFiles";
import SearchBar from "../general/searchBar";

export interface networkFileStructure {
    file: {
        "name": string,
        "lastModified": number,
        "size": number
    }
    prices: Map<string, number>
}


interface FileMetadata {
    "Name" : string,
    "Size" : number, 
    "FileType": "string"
}

export interface FileInfo {
    "Price": number, 
    "FileMeta": FileMetadata
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
    const {isDarkMode} = useAppContext();

    return(
        <div className="page-content">
            <div className="page-file-header"> 
                <p style={{ color:isDarkMode ? 'white' : 'black'}}>Purchase Files using Content Hash</p>
            </div>            
            <hr></hr>
            <div id = "top-widgets">
                <SearchBar />
            </div>
            <br></br>
            <hr></hr>
            <div className="page-file-header"> 
                <p style={{ color:isDarkMode ? 'white' : 'black'}}>Explore Network Files</p>
            </div>
            <NetworkFilesTable items={tempItems} headings={headings}/>
        </div>
    )
}