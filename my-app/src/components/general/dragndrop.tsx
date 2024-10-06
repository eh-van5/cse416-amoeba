export default function FileUploadWidget(){
    function dropHandler(event: React.DragEvent){
        event.preventDefault();
        console.log("Something has been dropped");
        Array.from(event.dataTransfer.items).forEach((item, i) => {
            if (item.kind === "file"){
                const file = item.getAsFile();
                if (file === null){
                    throw Error("Parsing something that isn't a file");
                }
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
        console.log(filesList)
    }
    return (
        <div 
        id = "file-drop-zone" 
        onDrop={dropHandler} 
        onDragOver={dragOverHandler}
        >
            <p>Drag and Drop</p>
            <p>or</p>
            <label htmlFor="file-upload" id="file-upload-label"><u>Browse</u></label>
            <input type="file" id="file-upload" multiple onChange={fileSelectorHandler} />
        </div>
    )
}