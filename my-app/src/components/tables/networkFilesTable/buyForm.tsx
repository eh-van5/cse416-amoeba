import { FileInfo } from "../../pages/networkFiles";

interface BuyFormProps {
    hostToFile: Record<string, FileInfo>;
  }

function cancel(e: React.MouseEvent){
    const purchaseForm = document.getElementById("purchase-form") as HTMLDialogElement;
    purchaseForm.close();
}

function buy(e : React.FormEvent<HTMLFormElement>){
    e.preventDefault();
    // should pull from backend
    const walletNum = 20;
    // submit should send a put request into backend and backend should return error
    // error checking should not be done in the front end here
    const options = document.getElementsByName("provider") as NodeListOf<HTMLInputElement>;
    const purchaseForm = document.getElementById("purchase-form") as HTMLDialogElement;

    options.forEach(option => {
        if (option.checked){
            const value = parseFloat(option.defaultValue);
            if (value <= walletNum) {
                purchaseForm.close();
            } else {
                alert("YOU DO NOT HAVE ENOUGH MONEY TO PURCHASE THE FILE");
            }
        }
    })


    
}

export default function BuyForm({hostToFile}: BuyFormProps) {
    const owners = Object.keys(hostToFile)
    const options = Array.from(owners).map((owner: string) => {
        const price = hostToFile[owner]?.Price
        return (
            <div id="provider-options">
                <input 
                id={owner + price}
                className = "buyFormRadio" 
                required 
                name = "provider" 
                value = {price}
                type = "radio">
                </input>
                <label className = "buyFormPrices">${price} </label>
                <label className = "buyFormOwners">{owner}</label>
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