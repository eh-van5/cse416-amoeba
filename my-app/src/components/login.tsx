import { useState } from "react";
import { Dispatcher } from "../App";
import logo from "../images/colony-logo-transparent.png";

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

    const login = () => props.setLoggedIn(true);

    function loginPage(){
        return(
            <>
                <h1 className="login-text">Login</h1>
                <input className="login-input" type="text" placeholder={"Private Key..."}/>
                <button id='login-button' className="button" type="button" onClick={login}>Continue</button>

                <p className="login"><i>Don't have an account?</i></p>
                <p className="login login-link"><i><u>Create a Wallet</u></i></p>
            </>
        )
    }

    return (
        <>
            <div className="login-banner">
                <img id="login-banner-logo" src={logo} alt="app logo" />
                <span id="login-banner-text">Colony</span>
            </div>
            <div className="login-box">
            
            </div>
        </>
    )
}