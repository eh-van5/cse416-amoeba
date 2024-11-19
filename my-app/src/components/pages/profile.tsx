import { useState } from "react";
import { Dispatcher } from "../../App";
import { useTheme } from "../../ThemeContext";
import { UserProfileIcon, CopyIcon } from "../../images/icons/icons";


export default function ProfilePage(){
    const { isDarkMode, toggleTheme } = useTheme();

    function credentialField(name: string, value: string){
        return(
            <div className="profile-credential-box">
                <p className="create-wallet-key-name">{name}</p>
                <div className="create-wallet-key-box">
                    <p className="create-wallet-key">{value}</p>
                    <div className="copy-clipboard"><CopyIcon/></div>
                </div>
                <p style={{visibility: "hidden"}} className="copy-clipboard-status">Copied to clipboard ✓</p>
            </div>
        )
    }

    return(
        <div className="page-content">
            <h1 style={{ color: isDarkMode ? 'white' : 'black' }}>Profile</h1>
            <div className={`box-container${isDarkMode ? '-dark' : ''}`} style={{height: "82vh", padding: "20px 30px"}}>
                <div className="profile-user-container">
                    <div className="profile-img">
                        <UserProfileIcon/>
                    </div>
                    <div>
                        <h2 className="profile-title">Colonist</h2>
                        <div style={{display: "flex", alignItems: "center", gap: "20px"}}>
                            <h2 className="profile-address">bcrt1qq79q7welcr2xtpsu0nu3cvpt4pn7jpr8nczm3z</h2>
                            <div className="copy-clipboard" style={{width: "35px"}}><CopyIcon/></div>
                        </div>
                    </div>
                </div>
                <hr />
                <div>
                    {credentialField("Wallet Address", "bcrt1qq79q7welcr2xtpsu0nu3cvpt4pn7jpr8nczm3z")}
                    {credentialField("Private Key", "・・・・・・・・・・・・・・・")}
                    <input className="create-wallet-key-box" type="password" name="profile-password" placeholder="Enter your password"
                    style={{width: "20%"}}/>
                    {/* <span style={{fontSize: "small", color: "red"}}>Incorrect password. Please try again.</span> */}
                </div>
            </div>
        </div>
    )
}