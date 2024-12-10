import { useState } from "react";
import { Dispatcher } from "../../App";
import { useAppContext } from "../../AppContext";
import { UserProfileIcon, CopyIcon } from "../../images/icons/icons";

interface ProfileProps {
    username: string;
    password: string;
    walletAddress: string;
    privateKey: string;
  }
  
export default function ProfilePage(props: ProfileProps) {
    const { isDarkMode, toggleTheme } = useAppContext();

    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [passwordInput, setPasswordInput] = useState("");
    const [privateKeyPasswordInput, setPrivateKeyPasswordInput] = useState("");
    const [isPrivateKeyVisible, setIsPrivateKeyVisible] = useState(false);
  
    const handleRevealPassword = () => {
      if (passwordInput === props.password) {
        setIsPasswordVisible(true);
      } else {
        alert("Incorrect password!");
      }
    };
  
    const handleRevealPrivateKey = () => {
      if (privateKeyPasswordInput === props.password) {
        setIsPrivateKeyVisible(true);
      } else {
        alert("Incorrect password!");
      }
    };
  
    const handleCopyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text);
      alert("Copied to clipboard!");
    };
  
    return (
        <div className="page-content">
            <h1 style={{ color: isDarkMode ? 'white' : 'black' }}>Profile</h1>
            <div className={`box-container${isDarkMode ? "-dark" : ""}`} style={{ height: "82vh", padding: "20px 30px" }}>
                <div className="profile-header">
                    <div className="profile-img">
                        <UserProfileIcon/>
                    </div>
                    <div style={{display: "flex", flexDirection: "column", alignItems: "flex-start"}}>
                        <h2 className="profile-title">Colonist</h2>
                        <h2 className="profile-address">{props.username}</h2>
                    </div>
                </div>
                <hr />
                <div className="profile-fields">
                <div className="profile-field bordered">
                    <label>Wallet Address:</label>
                    <div className="field-content">
                    <span>{props.walletAddress}</span>
                    <button className="copy-icon" onClick={() => handleCopyToClipboard(props.walletAddress)}>&#x2398;</button>
                    </div>
                </div>
                <div className="profile-field bordered">
                    <label>Password:</label>
                    <div className="field-content">
                    <span>{isPasswordVisible ? props.password : "••••••••"}</span>
                    {!isPasswordVisible && (
                        <div className="reveal-key">
                        <input
                            type="password"
                            placeholder="Enter password"
                            value={passwordInput}
                            onChange={(e) => setPasswordInput(e.target.value)}
                        />
                        <button onClick={handleRevealPassword}>Reveal</button>
                        </div>
                    )}
                    </div>
                </div>
                <div className="profile-field bordered">
                    <label>Private Key:</label>
                    <div className="field-content">
                    <span>{isPrivateKeyVisible ? props.privateKey : "••••••••"}</span>
                    {!isPrivateKeyVisible && (
                        <div className="reveal-key">
                        <input
                            type="password"
                            placeholder="Enter password"
                            value={privateKeyPasswordInput}
                            onChange={(e) => setPrivateKeyPasswordInput(e.target.value)}
                        />
                        <button onClick={handleRevealPrivateKey}>Reveal</button>
                        </div>
                    )}
                    {isPrivateKeyVisible && (
                        <button className="copy-icon" onClick={() => handleCopyToClipboard(props.privateKey)}>&#x2398;</button>
                    )}
                    </div>
                </div>
                </div>
            </div>
        </div>
    );
};

// export default function ProfilePage(){
//     const { isDarkMode, toggleTheme } = useAppContext();

//     function credentialField(name: string, value: string){
//         return(
//             <div className="profile-credential-box">
//                 <p className="create-wallet-key-name">{name}</p>
//                 <div className="create-wallet-key-box">
//                     <p className="create-wallet-key">{value}</p>
//                     <div className="copy-clipboard"><CopyIcon/></div>
//                 </div>
//                 <p style={{visibility: "hidden"}} className="copy-clipboard-status">Copied to clipboard ✓</p>
//             </div>
//         )
//     }

//     return(
//         <div className="page-content">
//             <h1 style={{ color: isDarkMode ? 'white' : 'black' }}>Profile</h1>
//             <div className={`box-container${isDarkMode ? '-dark' : ''}`} style={{height: "82vh", padding: "20px 30px"}}>
//                 <div className="profile-user-container">
//                     <div className="profile-img">
//                         <UserProfileIcon/>
//                     </div>
//                     <div>
//                         <h2 className="profile-title">Colonist</h2>
//                         <div style={{display: "flex", alignItems: "center", gap: "20px"}}>
//                             <h2 className="profile-address">bcrt1qq79q7welcr2xtpsu0nu3cvpt4pn7jpr8nczm3z</h2>
//                             <div className="copy-clipboard" style={{width: "35px"}}><CopyIcon/></div>
//                         </div>
//                     </div>
//                 </div>
//                 <hr />
//                 <div>
//                     {credentialField("Wallet Address", "bcrt1qq79q7welcr2xtpsu0nu3cvpt4pn7jpr8nczm3z")}
//                     {credentialField("Private Key", "・・・・・・・・・・・・・・・")}
//                     <input className="create-wallet-key-box" type="password" name="profile-password" placeholder="Enter your password"
//                     style={{width: "20%"}}/>
//                     {/* <span style={{fontSize: "small", color: "red"}}>Incorrect password. Please try again.</span> */}
//                 </div>
//             </div>
//         </div>
//     )
// }