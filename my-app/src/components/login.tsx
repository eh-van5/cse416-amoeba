import logo from "../images/colony-logo-transparent.png";

export default function Login(){
    return (
        <div>
            <div className="login-banner">
                <img id="login-banner-logo" src={logo} alt="app logo" />
                <span id="login-banner-text">Colony</span>
            </div>
            <div className="login-box">
                <h1 className="login-text">Login</h1>
                <input className="login-input" type="text" value={"Private Key..."}/>
                <button className="login-button" type="button">Continue</button>

                <p className="login"><i>Don't have an account?</i></p>
                <p className="login login-link"><i><u>Register</u></i></p>
                <p className="login login-link"><i><u>Forgot password?</u></i></p>
            </div>
        </div>
    )
}