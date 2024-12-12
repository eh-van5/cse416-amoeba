import { ChangeEvent, useState } from "react";
import { Dispatcher } from "../App";
import logo from "../images/colony-logo-transparent.png";
import { CopyIcon } from "../images/icons/icons";
import axios, { AxiosError } from "axios";
import { TailSpin } from "react-loader-spinner";
import { UploadFileIcon } from "../images/icons/icons";
// Note: Theme is defaulted to light and cannot be controlled from lpgin page. Consider defaulting the theme based on the browser theme

enum LoginPage{
    Login,
    CreateWallet,
    ImportWallet,
}

interface Props{
    setLoggedIn: Dispatcher<boolean>;
}

interface User{
    username: string;
    password: string;
    address: string;
    newPassword: string;
    confirmPassword: string;
}

export default function Login(props: Props){
    // http server PORT
    const PORT = 8000;

    const[currentPage, setCurrentPage] = useState<LoginPage>(LoginPage.Login);
    const[loading, setLoading] = useState<boolean>(false);

    const[user, setUser] = useState<User>({
        username: "",
        password: "",
        address: "",
        newPassword: "",
        confirmPassword: "",
    })

    const[error, setError] = useState<string>("")

    const[walletCreated, setWalletCreated] = useState<boolean>(false);
    const[copied, setCopied] = useState<boolean[]>([false, false, false]);

    const[walletAddress, setWalletAddress] = useState<string>("Create a Wallet");

    const[walletFile, setWalletFile] = useState<File | undefined>(undefined);

    // Backend Functions *********************************************
    const goToCreateWallet = () => {
        setError("")
        setLoading(false)
        setCurrentPage(LoginPage.CreateWallet);
        setWalletCreated(false);
        setWalletAddress("Create a Wallet")
        setUser({
            username: "",
            password: "",
            address: "",
            newPassword: "",
            confirmPassword: "",
        })
    }

    const goToImportWallet = () => {
        setError("")
        setLoading(false)
        setCurrentPage(LoginPage.ImportWallet);
        setUser({
            username: "",
            password: "",
            address: "",
            newPassword: "",
            confirmPassword: "",
        })
    }

    const goToLogin = () => {
        setError("")
        setLoading(false)
        setCurrentPage(LoginPage.Login);
        setUser({
            username: "",
            password: "",
            address: "",
            newPassword: "",
            confirmPassword: "",
        })
    }
    const onUserChange = (e: ChangeEvent<HTMLInputElement>) => {
        setUser({...user, [e.target.name]: e.target.value})
    }
    const login = () => {
        console.log("attempting login...")
        
        setError("")
        if (user.username == "" || user.password == "" || user.address == ""){
            setError("There are missing fields. Please try again");
            return;
        }
        setLoading(true)
        axios.get(`http://localhost:${PORT}/login/${user.username}/${user.password}/${user.address}`)
        .then((response) => {
            console.log(response.data);
            props.setLoggedIn(true);
            setLoading(false)
        })
        .catch((error) => {
            console.log(error)
            setError(error.response.data)
            setLoading(false)
            return;
        })
        
    }
    const createWallet = async () => {
        console.log("creating wallet...")
        setError("")
        if (user.username == "" || user.newPassword == "" || user.confirmPassword == ""){
            setError("There are missing fields. Please try again");
            return;
        }

        if (user.newPassword !== user.confirmPassword){
            setError("Passwords do not match. Please try again");
            return;
        }

        setWalletAddress("Loading...");
        setLoading(true)
        let privateKey = "";
        let miningAddress = "";
        
        // Creates wallet and fetches private key
        let res = await axios.get(`http://localhost:${PORT}/createWallet/${user.username}/${user.newPassword}`)
        console.log("Created wallet")
        privateKey = res.data;

        // Logs into wallet to get wallet address
        res = await axios.get(`http://localhost:${PORT}/login/${user.username}/${user.newPassword}`)
        console.log(res.data)

        res = await axios.get(`http://localhost:${PORT}/generateAddress`)
        console.log("Generate address")
        miningAddress = res.data

        setWalletCreated(true);
        setWalletAddress(
            `[Seed Phrase]\n${privateKey}\n`+
            `\n[Wallet Address]\n${miningAddress}\n`
        );
        setLoading(false)
    }

    const importWallet = () => {
        if (user.username == "" || user.password == ""){
            setError("There are missing fields. Please try again");
            return;
        }

        setLoading(true)
        const formData = new FormData();
        console.log("created formData")
        formData.append('file', walletFile as File);

        console.log("posting formData")
        axios.post(`http://localhost:${PORT}/importWallet`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        })
        .then((response) => {
            console.log("successfully imported wallet")
            console.log(response.data)
            setLoading(false)
        })
        .catch((error) => {
            console.log(error)
            console.log("error import walling")
            setError("Unable to import wallet. Please try again")
            setLoading(false)
        })
    }

    const downloadTxtFile = () => {
        const element = document.createElement("a");
        const file = new Blob([walletAddress], {type: 'text/plain'});
        element.href = URL.createObjectURL(file);
        element.download = "Wallet_info.txt";
        document.body.appendChild(element); // Required for this to work in FireFox
        element.click();
    }


    function inputField(name:string, placeholder:string, inputName:string, hidden:boolean=false){
        return(
            <div className="login-input-box">
                <p className="login-input-text">{name}</p>
                <input className="login-input" type={hidden ? "password":"text"} name={inputName} placeholder={placeholder} onChange={onUserChange}/>
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
                <span className="error-message" style={{visibility: error==="" ? "hidden" : "visible"}}>{error}</span>
                {inputField("Login", "Enter Username", "username")}
                {inputField("Wallet Address", "Enter Wallet Address", "address")}
                {inputField("Password", "Enter Password", "password", true)}
                <button id='login-button' className="button" type="button" onClick={login}>Continue</button>
                <TailSpin visible={loading} width={50} color="#4470ff" radius={1}/>
                <p className="login"><i>Don't have an account?</i></p>
                <a className="login login-link" onClick={goToCreateWallet}><i><u>Create a Wallet</u></i></a>
                <p className="login"><i>Have a wallet?</i></p>
                <a className="login login-link" onClick={goToImportWallet}><i><u>Import a Wallet</u></i></a>
            </div>
        )
    }

    function createWalletPage(){
        return(
            <div className="login-box" style={{width: "1200px"}}>
                <h1 className="login-text" style={{paddingBottom: "2%"}}>Create Wallet</h1>
                <div style={{display: "flex", flexDirection: "row", gap: "40px"}}>
                    <div style={{width:"500px", display:"flex", flexDirection:"column", alignItems:"center"}}>
                        <span className="error-message" style={{visibility: error==="" ? "hidden" : "visible"}}>{error}</span>
                        {inputField("New Username", "Enter Username", "username")}
                        {inputField("New Password", "Enter Password", "newPassword", true)}
                        {inputField("Confirm Password", "Re-enter Password", "confirmPassword", true)}
                        <button id='login-button' className="button" type="button" onClick={createWallet}>Create Wallet</button>
                        
                        <p className="login"><i>Already have an account?</i></p>
                        <a className="login login-link" onClick={goToLogin}><i><u>Login</u></i></a>
                    </div>
                    <div className="vertical-line"></div>
                    <div style={{width:"500px", display: walletCreated ? "none" : "flex", justifyContent: "center", paddingTop: "150px"}}>
                        <TailSpin visible={loading} width={100} color="#4470ff" radius={1}/>
                    </div>
                    <div style={{width: "500px", display: walletCreated ? "flex" : "none", flexDirection: "column", alignItems: "center"}}>
                        {outputField("Wallet", walletAddress, 0, 450, 250)}
                        <button id='create-wallet-export-button' className="create-wallet-button" type="button" onClick={downloadTxtFile} style={{visibility: walletCreated ? "visible" : "hidden"}}>Export Wallet</button>
                        <button id='create-wallet-login-button' className="create-wallet-button" type="button" onClick={() => setCurrentPage(LoginPage.Login)} style={{visibility: walletCreated ? "visible" : "hidden"}}>Login</button>
                    </div>
                </div>
            </div>
        )
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
                if (file.name !== "wallet.db"){
                    setError("Invalid wallet file. Please import a 'wallet.db' file")
                    return
                }
                setError("")
                setWalletFile(file)
            }
        })
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
        const file = filesList[0]
        if (file.name !== "wallet.db"){
            setError("Invalid wallet file. Please import a 'wallet.db' file")
            return
        }
        setError("")
        setWalletFile(filesList[0])
    }

    function importWalletPage(){
        return(
            <div className="login-box">
                <h1 className="login-text" style={{paddingBottom: "2%"}}>Import Wallet</h1>
                <p>Import wallet.db - this will delete any existing wallet.*</p>
                <div id = "file-widget">
                    <div             
                    onDrop={dropHandler} 
                    onDragOver={dragOverHandler}
                    id = "drop-zone"> 
                        <form>
                            <label id = "upload-methods" htmlFor="file-upload">
                                <div style={{display: walletFile ? "none" : "block"}}>
                                    <br /> {UploadFileIcon()}
                                    <p>Drag and Drop</p>
                                    <p>or</p>
                                </div>
                                <p style={{display: walletFile ? "block" : "none"}}>{walletFile ? walletFile.name : ""}</p>
                                <label htmlFor="file-upload" id="upload-label"><u>Browse</u></label>
                                <input type="file" id="file-upload" onChange={fileSelectorHandler} />
                            </label>
                        </form>
                    </div>
                </div>
                <span className="error-message" style={{visibility: error==="" ? "hidden" : "visible"}}>{error}</span>
                {inputField("Username", "Enter Username", "username")}
                {inputField("Password", "Enter Password", "password", true)}
                <button id='login-button' className="button" type="button" onClick={importWallet}>Import</button>
                <TailSpin visible={loading} width={50} color="#4470ff" radius={1}/>
                <p className="login"><i>Already have an account?</i></p>
                <a className="login login-link" onClick={goToLogin}><i><u>Login</u></i></a>
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
                    [LoginPage.ImportWallet]: importWalletPage() ,
                })[currentPage]
            }
        </div>
    )
}