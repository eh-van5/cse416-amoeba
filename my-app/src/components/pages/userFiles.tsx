import { useEffect, useState } from "react";
import { useAppContext } from "../../AppContext";
import PriceFilesWidget from "../general/priceFilesWidget/priceFilesWidget";
import UploadFileWidget from "../general/uploadFileWidget";
import UserFilesTable from "../tables/userFilesTable/userFilesTable";

export interface UserFileData{
	Price: number
	Name: string
	Size: number
	FileType: string
    LastModified: number
}

export interface FileData{
    price: number,
    file: File
}

export default function UserFilesPage(){
    const [sharedFiles, setSharedFiles] = useState<UserFileData[]>([]);
    const [uploadedFiles, setUploadedFiles] = useState<Map<string, FileData>>(new Map());
    const {isDarkMode} = useAppContext();
    console.log(uploadedFiles);
    useEffect(() => {
        const getAllFiles = async () => {
            const PORT = 8088
            const response = await fetch(`http://localhost:${PORT}/getUserFiles`, {
                method: 'GET',
            });
            if (response.ok) { 
                const files = await response.json();
                console.log(files);
                setSharedFiles(files);
            } else {
                alert("Error fetching user files.");
            }
        } 
        getAllFiles();
    }, [sharedFiles, uploadedFiles]);
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
                    return a.Name.localeCompare(b.Name) * order;
                case "Price":
                    return (a.Price-b.Price) * order
                // case "Last Modified":
                //     return (a.file.lastModified - b.file.lastModified )* order
                case "Size": 
                    return (a.Size - b.Size) * order
            }
            return a.Name.localeCompare(b.Name) * order;
        })
        setSharedFiles([...sharedFiles]);
    }

    return(
        <div className="page-content">
            <div className="page-file-header"> 
                <p style={{ color:isDarkMode ? 'white' : 'black'}}>Share Files</p>
            </div>
            <hr></hr>
            <div id = "top-file-widgets">
                <UploadFileWidget files = {uploadedFiles} setItems = {setUploadedFiles} />
                <PriceFilesWidget uploadedFiles = {uploadedFiles} setUploadedFiles = {setUploadedFiles} />
            </div>
            <hr></hr>
            <div className="page-file-header"> 
                <p className = "title" style={{ color:isDarkMode ? 'white' : 'black'}}>Current Files</p>
                <select className = "sortBy" onChange={sortBy}>
                    <option value="" selected disabled hidden>Sort By</option>
                    {options}
                </select>
            </div>
            <UserFilesTable items={sharedFiles} setItems = {setSharedFiles} headings={headings}/>
        </div>
    )
}