import { ReactElement } from "react";
import { UploadFileIcon } from "../../images/icons/icons";
import { useTheme } from "../../ThemeContext";

interface UploadFileWidgetProps{
    setItems: React.Dispatch<React.SetStateAction<ReactElement[]>>
}
export default function UploadFileWidget({setItems}: UploadFileWidgetProps){
    const {isDarkMode} = useTheme();

    function readFile(file: File){
        const reader = new FileReader();
        reader.addEventListener('loadstart', (function(f) {
            return (event) =>{
                const loadingBar = document.getElementById("file-progress-bar");
                if (loadingBar){
                    console.log(loadingBar);
                    // loadingBar.innerHTML = "Loading " + file.name;
                    loadingBar.style.width = "0%";
                } 
                console.log(f);
            }
        })(file))
        reader.addEventListener('loadend', (function(f) {
            return (event) => {
                const new_item = [
                    <span className="items-table-item">{f.name}</span>,
                    <span className="items-table-item">you</span>,
                    <span className="items-table-item">{f.lastModified}</span>,
                    <span className="items-table-item">Not Sharing</span>,
                    <span className="items-table-item">{f.size}</span>
                ];
                // console.log([...items, ...new_item])
                setItems(prevItems => [...prevItems, ...new_item]);
            }
        })(file));
        reader.readAsDataURL(file);
    }
    function dropHandler(event: React.DragEvent){
        event.preventDefault();
        console.log("Something has been dropped");

        Array.from(event.dataTransfer.items).forEach((item, i) => {
            if (item.kind === "file"){
                const file = item.getAsFile();
                if (file === null){
                    throw Error("Parsing something that isn't a file");
                }
                readFile(file);
            }
        })
    }
    function dragOverHandler(event: React.DragEvent){
        event.preventDefault();
    }
    function fileSelectorHandler(event: React.ChangeEvent){
        const target = event.target as HTMLInputElement;
        const filesList = target.files;
        if (filesList === null){
            throw Error;
        }

        Object.values(filesList).forEach(file => {
            readFile(file);
        })
    }
    return (
        <div id = "file-widget">
            <div             
            onDrop={dropHandler} 
            onDragOver={dragOverHandler}
            id = "drop-zone" style={(isDarkMode ? {backgroundColor: '#215F64'} : {})}> 
                <label id = "upload-methods" htmlFor="file-upload">
                    <br /> {UploadFileIcon()}
                    <p style={(isDarkMode ? {color: 'white'} : {})}>Drag and Drop</p>
                    <p style={(isDarkMode ? {color: 'white'} : {})}>or</p>
                    <label htmlFor="file-upload" id="upload-label"><u>Browse</u></label>
                    <input type="file" id="file-upload" multiple onChange={fileSelectorHandler} />
                </label>
            </div>
            {/* <div id = "file-progress">
                <div id = "file-progress-bar">
                </div>
            </div>
            <div id = "files-uploaded">
            </div> */}
        </div>
    )
}