import { useState } from "react";
import { Dispatcher } from "../../App";
import { useAppContext } from "../../AppContext";
import { UserProfileIcon, CopyIcon } from "../../images/icons/icons";

interface ProfileProps {
    username: string;
    password: string;
    walletAddress: string;
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
                </div>
            </div>
        </div>
    );
};