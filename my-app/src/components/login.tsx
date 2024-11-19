import { useState } from "react";
import { Dispatcher } from "../App";
import logo from "../images/colony-logo-transparent.png";
import { CopyIcon } from "../images/icons/icons";
// Note: Theme is defaulted to light and cannot be controlled from lpgin page. Consider defaulting the theme based on the browser theme

enum LoginPage{
    Login,
    CreateWallet,
    ViewWallet
}

interface Props{
    setLoggedIn: Dispatcher<boolean>;
}

export default function Login(props: Props){
    const[currentPage, setCurrentPage] = useState<LoginPage>(LoginPage.Login);
    const[walletCreated, setWalletCreated] = useState<boolean>(false);
    const[copied, setCopied] = useState<boolean[]>([false, false, false]);

    const[walletAddress, setWalletAddress] = useState<string>("Create a Wallet");

    const login = () => props.setLoggedIn(true);
    const goToCreateWallet = () => {
        setCurrentPage(LoginPage.CreateWallet);
        setWalletCreated(false);
        setWalletAddress("Create a Wallet")
        setCopied([false, false, false]);
    }
    const createWallet = () => {
        setWalletAddress("Loading...");
        setTimeout(() => {
            setWalletCreated(true);
            setWalletAddress(
                "[Private Key]\nbcrt1qq79q7welcr2xtpsu0nu3cvpt4pn7jpr8nczm3z\n"+
                "\n[Public Key]\nbcrt1qq79q7welcr2xtpsu0nu3cvpt4pn7jpr8nczm3z\n"+
                "\n[Wallet Address]\nbcrt1qq79q7welcr2xtpsu0nu3cvpt4pn7jpr8nczm3z\n"
            );
        }, 1000);
    }
    const copyToClipboard = (i:number) => {
        const newValues = copied.map((v, index) => {
            if(i === index) return true;
            else return v;
        });
        setCopied(newValues);
        navigator.clipboard.writeText(walletAddress);
    }

    const downloadTxtFile = () => {
        const element = document.createElement("a");
        const file = new Blob([walletAddress], {type: 'text/plain'});
        element.href = URL.createObjectURL(file);
        element.download = "Wallet_info.txt";
        document.body.appendChild(element); // Required for this to work in FireFox
        element.click();
    }

    function inputField(name:string, placeholder:string){
        return(
            <div className="login-input-box">
                <p className="login-input-text">{name}</p>
                <input className="login-input" type="text" placeholder={placeholder}/>
            </div>
        )
    }

    function outputField(name:string, text:string, clipboardindex:number, width:number=450, height:number=45){
        return(
            <div>
                <p className="create-wallet-key-name">{name}</p>
                <div className="create-wallet-key-box" style={{maxWidth:width+"px", height:height+"px"}}>
                    <p style={{color: walletCreated ? "black" : "#ababad"}} className="create-wallet-key">{text}</p>
                    {/* <div className="copy-clipboard" onClick={() => copyToClipboard(clipboardindex)}><CopyIcon/></div> */}
                </div>
                {/* <p style={{visibility: copied[clipboardindex] ? "visible" : "hidden"}} className="copy-clipboard-status">Copied to clipboard ✓</p> */}
            </div>
        )
    }

    function loginPage(){
        return(
            <div className="login-box">
                <h1 className="login-text">Login</h1>
                {/* <span style={{fontSize: "small", color: "red"}}>Incorrect address or password. Please try again.</span> */}
                {inputField("Login", "Enter Wallet Address")}
                {inputField("Password", "Enter Password")}
                <button id='login-button' className="button" type="button" onClick={login}>Continue</button>

                <p className="login"><i>Don't have an account?</i></p>
                <a className="login login-link" onClick={goToCreateWallet}><i><u>Create a Wallet</u></i></a>
            </div>
        )
    }

    function createWalletPage(){
        return(
            <div className="login-box" style={{width: "1200px"}}>
                <h1 className="login-text">Create Wallet</h1>
                <div style={{display: "flex", flexDirection: "row", gap: "40px"}}>
                    <div style={{width:"400px", display:"flex", flexDirection:"column", alignItems:"center"}}>
                        {inputField("New Password", "Enter Password")}
                        {inputField("Confirm Password", "Re-enter Password")}
                        <button id='login-button' className="button" type="button" onClick={createWallet}>Create Wallet</button>
                        <p className="login"><i>Already have an account?</i></p>
                        <a className="login login-link" onClick={() => setCurrentPage(LoginPage.Login)}><i><u>Login</u></i></a>
                    </div>
                    <div className="vertical-line"></div>
                    <div style={{width:"500px", display: "flex", flexDirection: "column", alignItems: "center"}}>
                        {outputField("Wallet", walletAddress, 0, 450, 200)}
                        <button id='create-wallet-export-button' className="create-wallet-button" type="button" onClick={downloadTxtFile} style={{visibility: walletCreated ? "visible" : "hidden"}}>Export Wallet</button>
                        <button id='create-wallet-login-button' className="create-wallet-button" type="button" onClick={() => setCurrentPage(LoginPage.Login)} style={{visibility: walletCreated ? "visible" : "hidden"}}>Login</button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="login-page">
            <div className="login-banner">
                <img id="login-banner-logo" src={logo} alt="app logo" />
                <span id="login-banner-text">Colony</span>
            </div>
            {
                ({
                    [LoginPage.Login]: loginPage() ,
                    [LoginPage.CreateWallet]: createWalletPage() ,
                    [LoginPage.ViewWallet]: <></> ,
                })[currentPage]
            }
        </div>
    )
}