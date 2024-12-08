import { UploadFileIcon } from "../../images/icons/icons";
import { useAppContext } from "../../AppContext";
import { UserFileData } from "../pages/userFiles";

interface UploadFileWidgetProps{
    files: Map<string, UserFileData>
    setItems: React.Dispatch<React.SetStateAction<Map<string, UserFileData>>>
}
export default function UploadFileWidget({files, setItems}: UploadFileWidgetProps){
    const {isDarkMode} = useAppContext();

    // function readFile(file: File){
    //     const reader = new FileReader();
    //     reader.addEventListener('loadstart', (function(f) {
    //         return (event) =>{
    //             const loadingBar = document.getElementById("file-progress-bar");
    //             if (loadingBar){
    //                 console.log(loadingBar);
    //                 // loadingBar.innerHTML = "Loading " + file.name;
    //                 loadingBar.style.width = "0%";
    //             } 
    //             console.log(f);
    //         }
    //     })(file))
    //     reader.addEventListener('loadend', (function(f) {
    //         return (event) => {
    //             setItems(prevItems => [...prevItems, f]);
    //         }
    //     })(file));
    //     reader.readAsDataURL(file);
    // }

    // register files into dht
    function dropHandler(event: React.DragEvent){
        event.preventDefault();
        console.log("Something has been dropped");

        Array.from(event.dataTransfer.items).forEach((item, i) => {
            if (item.kind === "file"){
                const file = item.getAsFile();
                if (file === null){
                    throw Error("Parsing something that isn't a file");
                }
                files.set(file.name, {file: file, price: 0, shared: false});
            }
        })
        setItems(new Map(files));
    }
    function dragOverHandler(event: React.DragEvent){
        event.preventDefault();
    }
    // here is where u register files into dht
    function fileSelectorHandler(event: React.ChangeEvent){
        const target = event.target as HTMLInputElement;
        const filesList = target.files;
        if (filesList === null){
            throw Error;
        }
        Object.values(filesList).forEach(file => {
            files.set(file.name, {file: file, price: 0, shared: false});
        })
        setItems(new Map(files));
    }

    return (
        <div id = "file-widget">
            <div             
            onDrop={dropHandler} 
            onDragOver={dragOverHandler}
            id = "drop-zone" style={(isDarkMode ? {backgroundColor: '#215F64'} : {})}> 
                <form>
                    <label id = "upload-methods" htmlFor="file-upload">
                        <br /> {UploadFileIcon()}
                        <p style={(isDarkMode ? {color: 'white'} : {})}>Drag and Drop</p>
                        <p style={(isDarkMode ? {color: 'white'} : {})}>or</p>
                        <label htmlFor="file-upload" id="upload-label"><u>Browse</u></label>
                        <input type="file" id="file-upload" multiple onChange={fileSelectorHandler} />
                    </label>
                </form>
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