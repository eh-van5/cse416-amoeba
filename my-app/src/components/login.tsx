import { Dispatcher } from "../App";
import logo from "../images/colony-logo-transparent.png";

interface Props{
    setLoggedIn: Dispatcher<boolean>;
}

export default function Login(props: Props){
    function login(){
        props.setLoggedIn(true);
    }

    return (
        <>
            <div className="login-banner">
                <img id="login-banner-logo" src={logo} alt="app logo" />
                <span id="login-banner-text">Colony</span>
            </div>
            <div className="login-box">
                <h1 className="login-text">Login</h1>
                <input className="login-input" type="text" placeholder={"Private Key..."}/>
                <button id='login-button' className="button" type="button" onClick={login}>Continue</button>

                <p className="login"><i>Don't have an account?</i></p>
                <p className="login login-link"><i><u>Create a Wallet</u></i></p>
            </div>
        </>
    )
}