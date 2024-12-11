import { FileInfo } from "../../types";

interface BuyFormProps {
    hostToFile: Record<string, FileInfo>;
}

function cancel(e: React.MouseEvent){
    const purchaseForm = document.getElementById("purchase-form") as HTMLDialogElement;
    purchaseForm.close();
}

async function buy(e : React.FormEvent<HTMLFormElement>){
    e.preventDefault();
    // should pull from backend
    const walletNum = 20;


    // submit should send a put request into backend and backend should return error
    // error checking should not be done in the front end here
    const options = document.getElementsByName("provider") as NodeListOf<HTMLInputElement>;
    const purchaseForm = document.getElementById("purchase-form") as HTMLDialogElement;

    for (let i = 0; i < options.length; i++) {
        const option = options[i]
        if (option.checked){
            const value = parseFloat(option.defaultValue);
            if (value <= walletNum) {
                purchaseForm.close();
            } else {
                alert("YOU DO NOT HAVE ENOUGH MONEY TO PURCHASE THE FILE");
            }

            // default value: [price.toString(), owner, hash, filename]
            const formData = new FormData();
            const values = option.defaultValue.split(',')
            formData.append('targetpeerid', values[1]);
            formData.append('hash', values[2])
            formData.append('filename', values[3])
        
            const PORT = 8088;
            const response = await fetch(`http://localhost:${PORT}/buyFile`, {
                method:'POST',
                body: formData,
            })
        
            if (response.ok) {
                // Handle success
                console.log("uploaded files");
            }  else {
                // Handle error
                console.log(JSON.stringify(response));
                console.error('Error uploading files');
            }
            
            return;
        }
    }
    
}

export default function BuyForm({hostToFile}: BuyFormProps) {
    const owners = Object.keys(hostToFile)
    const options = Array.from(owners).map((owner: string) => {
        const price = hostToFile[owner]?.Price
        const filename = hostToFile[owner]?.Name
        const hash = hostToFile[owner]?.Hash
        return (
            <div id="provider-options">
                <input 
                id={owner + price}
                className = "buyFormRadio" 
                required 
                name = "provider" 
                value = {[price.toString(), owner, hash, filename]}
                type = "radio">
                </input>
                <label className = "buyFormPrices">${price} </label>
                <label className = "buyFormOwners">{owner}</label>
                <label className = "buyFormFilenames">{filename}</label>
            </div>
        )
    })
    return (
        <dialog id="purchase-form">
            <div id="purchase-form-header">Provider Options:</div>
            <form onSubmit={buy} method="dialog">
                <p id = "purchase-form-options-container">
                    {options}
                </p>
                <div id = "purchase-form-buttons">
                    <button onClick={cancel} id="cancel" type="reset">Cancel</button>
                    <button  type="submit">Confirm</button>
                </div>
            </form>
        </dialog>
    )
}