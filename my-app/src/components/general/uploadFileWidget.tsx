import { UploadFileIcon } from "../../images/icons/icons";

export default function UploadFileWidget(){
    function readFile(file: File){
        const reader = new FileReader();
        reader.addEventListener('load', (event) =>{
            if (event.target == null) {
                throw Error;
            }
            // const result = event.target.result;
            // console.log(result);
        })
        reader.addEventListener('progress', (event) => {
            if (event.loaded && event.total) {
                const percent = (event.loaded / event.total) * 100;
                const loadingBar = document.getElementById("file-drop-zone");
                console.log(`Progress: ${Math.round(percent)}`)
            }
        });
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
                console.log(`... file[${i}].name = ${file.name}`);
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
        <div             
        onDrop={dropHandler} 
        onDragOver={dragOverHandler}
        id = "file-drop-zone" > 
            <label id = "file-widget" htmlFor="file-upload">
                <br /> {UploadFileIcon()}
                <p>Drag and Drop</p>
                <p>or</p>
                <label htmlFor="file-upload" id="file-upload-label"><u>Browse</u></label>
                <input type="file" id="file-upload" multiple onChange={fileSelectorHandler} />
            </label>
        </div>
    )
}