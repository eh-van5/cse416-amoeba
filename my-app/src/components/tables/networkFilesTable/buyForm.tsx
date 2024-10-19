import { networkFileStructure } from "../../pages/networkFiles";

interface buyFormProps {
    item: networkFileStructure;
}

function cancel(e: React.MouseEvent){
    const purchaseForm = document.getElementById("purchase-form") as HTMLDialogElement;
    purchaseForm.close();
}

export default function BuyForm({item}: buyFormProps) {
    const owners = item.prices.keys()
    const options = Array.from(owners).map((owner: string) => {
        return (
            <div id="provider-options">
                <input className = "buyFormRadio" required name = "provider" type = "radio"></input>
                <label className = "buyFormPrices">${item.prices.get(owner)} </label>
                <label className = "buyFormOwners">{owner}</label>
            </div>
        )
    })
    return (
        <dialog id="purchase-form">
            <div id="purchase-form-header">Provider Options:</div>
            <form method="dialog">
                <p id = "purchase-form-options-container">
                    {options}
                </p>
                <div id = "purchase-form-buttons">
                    <button onClick={cancel} id="cancel" type="reset">Cancel</button>
                    <button type="submit">Confirm</button>
                </div>
            </form>
        </dialog>
    )
}