import { Dispatch, SetStateAction } from "react";
import logo from "../images/colony-logo-transparent.png";

// This is the type that setState from useState hook uses
// Simplified as a single type
type Dispatcher<S> = Dispatch<SetStateAction<S>>;

interface Props{
    setLoggedIn: Dispatcher<boolean>;
}

export default function Login(props: Props){
    function login(){
        props.setLoggedIn(true);
    }

    return (
        <div>
            <div className="login-banner">
                <img id="login-banner-logo" src={logo} alt="app logo" />
                <span id="login-banner-text">Colony</span>
            </div>
            <div className="login-box">
                <h1 className="login-text">Login</h1>
                <input className="login-input" type="text" placeholder={"Private Key..."}/>
                <button className="login-button" type="button" onClick={login}>Continue</button>

                <p className="login"><i>Don't have an account?</i></p>
                <p className="login login-link"><i><u>Register</u></i></p>
                <p className="login login-link"><i><u>Forgot password?</u></i></p>
            </div>
        </div>
    )
}