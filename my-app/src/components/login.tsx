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
        setTimeout(() => {setWalletCreated(true); setWalletAddress("bcrt1qq79q7welcr2xtpsu0nu3cvpt4pn7jpr8nczm3z");}, 1000);
    }
    const copyToClipboard = (i:number) => {
        const newValues = copied.map((v, index) => {
            if(i === index) return true;
            else return v;
        });
        setCopied(newValues);
        navigator.clipboard.writeText(walletAddress);
    }
    function loginPage(){
        return(
            <div className="login-box">
                <h1 className="login-text">Login</h1>
                <input className="login-input" type="text" placeholder={"Private Key..."}/>
                <button id='login-button' className="button" type="button" onClick={login}>Continue</button>

                <p className="login"><i>Don't have an account?</i></p>
                <a className="login login-link" onClick={goToCreateWallet}><i><u>Create a Wallet</u></i></a>
            </div>
        )
    }

    function createWalletPage(){
        return(
            <div className="login-box" style={{width: "60%", minWidth: "500px", maxWidth: "700px"}}>
                <h1 className="login-text">Create Wallet</h1>
                <div>
                    <p>Wallet Address</p>
                    <div className="create-wallet-key-box">
                        <p style={{color: walletCreated ? "black" : "#ababad"}} className="create-wallet-key">{walletAddress}</p>
                        <div className="copy-clipboard" onClick={() => copyToClipboard(0)}><CopyIcon/></div>
                    </div>
                    <p style={{visibility: copied[0] ? "visible" : "hidden"}} className="copy-clipboard-status">Copied to clipboard ✓</p>
                </div>
                <div>
                    <p>Public Key</p>
                    <div className="create-wallet-key-box">
                        <p style={{color: walletCreated ? "black" : "#ababad"}} className="create-wallet-key">{walletAddress}</p>
                        <div className="copy-clipboard" onClick={() => copyToClipboard(1)}><CopyIcon/></div>
                    </div>
                    <p style={{visibility: copied[1] ? "visible" : "hidden"}} className="copy-clipboard-status">Copied to clipboard ✓</p>
                </div>
                <div>
                    <p>Private Key</p>
                    <div className="create-wallet-key-box">
                        <p style={{color: walletCreated ? "black" : "#ababad"}} className="create-wallet-key">{walletAddress}</p>
                        <div className="copy-clipboard" onClick={() => copyToClipboard(2)}><CopyIcon/></div>
                    </div>
                    <p style={{visibility: copied[2] ? "visible" : "hidden"}} className="copy-clipboard-status">Copied to clipboard ✓</p>
                </div>
                <button id="export-wallet-button" type="button">Export Wallet</button>
                <button id='login-button' className="button" type="button" onClick={createWallet}>Create Wallet</button>
                <p className="login"><i>Already have an account?</i></p>
                <a className="login login-link" onClick={() => setCurrentPage(LoginPage.Login)}><i><u>Login</u></i></a>
            </div>
        )
    }

    return (
        <>
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
        </>
    )
}