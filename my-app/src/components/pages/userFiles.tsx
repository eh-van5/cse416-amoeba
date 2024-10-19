import { useState } from "react";
import { useTheme } from "../../ThemeContext";
import PriceFilesWidget from "../general/priceFilesWidget/priceFilesWidget";
import UploadFileWidget from "../general/uploadFileWidget";
import UserFilesTable from "../tables/userFilesTable/userFilesTable";

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

    const headings = [ "Status", "Name", "Price", "Last Modified", "Size"];
    const options = headings.map(heading => {
        return (
        <>
            <option>{heading}: Ascending</option>
            <option>{heading}: Descending</option>
        </>
        )
    })

    function sortBy(e: React.ChangeEvent<HTMLSelectElement>) {
        e.preventDefault();
        const typeArr = e.target.value.split(":");
        const sortType = typeArr[0];
        let order = 1;
        if (typeArr[1].trim() === "Descending") {
            order = -1;
        }
        sharedFiles.sort((a, b) => {
            switch(sortType) {
                case "Name":
                    return a.file.name.localeCompare(b.file.name) * order;
                case "Status":
                    const a_shared = a.shared ? 1 : 0;
                    const b_shared = b.shared ? 1 : 0;
                    return (a_shared - b_shared ) * order;
                case "Price":
                    return (a.price-b.price) * order
                case "Last Modified":
                    return (a.file.lastModified - b.file.lastModified )* order
                case "Size": 
                    return (a.file.size - b.file.size) * order
            }
            return a.file.name.localeCompare(b.file.name) * order;
        })
        setSharedFiles([...sharedFiles]);
    }

    return(
        <div className="page-content">
            <p style={{ color:isDarkMode ? 'white' : 'black'}}>Share Files</p>
            <hr></hr>
            <div id = "top-file-widgets">
                <UploadFileWidget files = {uploadedFiles} setItems = {setUploadedFiles} />
                <PriceFilesWidget sharedFiles = {sharedFiles} uploadedFiles = {uploadedFiles} setSharedFiles = {setSharedFiles} setUploadedFiles = {setUploadedFiles} />
            </div>
            <p style={{ color:isDarkMode ? 'white' : 'black'}}>Current Files</p>
            <hr></hr>
            <select onChange={sortBy}>
                <option value="" selected disabled hidden>Sort By</option>
                {options}
            </select>
            <UserFilesTable items={sharedFiles} setItems = {setSharedFiles} headings={headings}/>
        </div>
    )
}