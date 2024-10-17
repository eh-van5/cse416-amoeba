import { useState } from "react";
import { Dispatcher } from "../App";
import logo from "../images/colony-logo-transparent.png";
import user from "../images/user.png";
import { DashboardIcon, FileIcon, TransactionIcon, WalletIcon, MiningIcon, SettingsIcon, ExitIcon} from "../images/icons/icons";
import { Page } from "../App";
import { useTheme } from "../ThemeContext";

interface NavbarProps{
    setPage: Dispatcher<Page>;
    logout: () => void;
}

export default function Navbar(props: NavbarProps){
    const[minimized, setMinimized] = useState<boolean>(false);
    const{isDarkMode} = useTheme();

    return (
        <div className={`navbar-box${isDarkMode ? '-dark' : ''} ${minimized ? "minimized" : ""}`}>
            <div className={`navbar-banner${isDarkMode ? '-dark' : ''}`}>
                <img id="navbar-banner-logo" src={logo} alt="app logo" />
                {!minimized && <span id="navbar-banner-text">Colony</span>}
            </div>
            <svg onClick={()=>setMinimized(!minimized)} className="navbar-burger" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="0.5" stroke="#000000">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
            
            <div className="navbar-items">
                <NavbarItem icon={<DashboardIcon/>} text="Proxy" minimized={minimized} onClick={() => props.setPage(Page.Proxy)} theme={isDarkMode}/>
                <NavbarItem icon={<FileIcon/>} text="Files" minimized={minimized} onClick={() => props.setPage(Page.Files)} theme={isDarkMode}/>
                <NavbarItem icon={<TransactionIcon/>} text="Transactions" minimized={minimized} onClick={() => props.setPage(Page.Transactions)} theme={isDarkMode}/>
                <NavbarItem icon={<WalletIcon/>} text="Wallet" minimized={minimized} onClick={() => props.setPage(Page.Wallet)} theme={isDarkMode}/>
                <NavbarItem icon={<MiningIcon/>} text="Mining" minimized={minimized} onClick={() => props.setPage(Page.Mining)} theme={isDarkMode}/>
            </div>
            <NavbarItem icon={<SettingsIcon/>} text="Settings" minimized={minimized} id="navbar-settings" onClick={() => props.setPage(Page.Settings)} theme={isDarkMode}/>
            <hr style={{width: "90%"}}/>
            {!minimized && 
                <div className={`navbar-profile${isDarkMode ? '-dark' : ''}`}>
                    <img className="navbar-profile-img" src={user} alt="" />
                    <div style={{display: "flex", flexDirection: "column"}}>
                        <span style={{fontSize: "15px", color: isDarkMode ? 'white' : 'black'}}>Colonist</span>
                        <span style={{fontSize: "12px", color: isDarkMode ? 'white' : 'black'}}>9ea*************d9e</span>
                    </div>
                    <div className="navbar-profile-exit" onClick={props.logout}>
                        <ExitIcon/>
                    </div>
                </div>
            }
            {minimized && 
            <div className="navbar-profile-exit" onClick={props.logout}>
                <ExitIcon/>
            </div>
            }
            
        </div>
    )
}

interface ItemProp {
    theme: boolean;
    icon: React.ReactNode;
    text: string;
    minimized: boolean;
    onClick: () => void;
    id?: string;
}

function NavbarItem(props: ItemProp){
    return(
        <div 
        className={`navbar-item${props.theme ? '-dark' : ''}`} 
        id={props.id ? props.id: ""} 
        onClick={props.onClick}
        tabIndex={0}>
            <div className="navbar-item-logo">{props.icon}</div>
            {!props.minimized && <span className={`navbar-item-text${props.theme ? '-dark' : ''}`}>{props.text}</span>}
        </div>
    )
}