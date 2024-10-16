import { UploadFileIcon } from "../../images/icons/icons";
import { useTheme } from "../../ThemeContext";

export default function UploadFileWidget(){
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
        reader.addEventListener('progress', (function(f) {
            return (event) => {
                if (event.loaded && event.total) {
                    const percent = (event.loaded / event.total) * 100;
                    const loadingBar = document.getElementById("file-progress-bar");
                    const files = document.getElementById("files-uploaded");
                    if (loadingBar && files){
                        console.log(f.name);
                        if (percent >= 100){
                            loadingBar.style.width = "100%";
                            files.innerHTML = "Loaded " + f.name;
                        } else {
                            loadingBar.style.width = percent + "%";
                        }
                    }

                    console.log(`Progress: ${Math.round(percent)}`)
                }
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