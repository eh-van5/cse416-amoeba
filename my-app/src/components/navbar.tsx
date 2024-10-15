import { useState } from "react";
import { Dispatcher } from "../App";
import logo from "../images/colony-logo-transparent.png";
import user from "../images/user.png";
import { DashboardIcon, FileIcon, TransactionIcon, WalletIcon, MiningIcon, SettingsIcon, ExitIcon} from "../images/icons/icons";
import { Page } from "../App";

interface NavbarProps{
    setPage: Dispatcher<Page>;
    logout: () => void;
}

export default function Navbar(props: NavbarProps){
    const[minimized, setMinimized] = useState<boolean>(false);

    return (
        <div className={`navbar-box ${minimized ? "minimized" : ""}`}>
            <div className="navbar-banner">
                <img id="navbar-banner-logo" src={logo} alt="app logo" />
                {!minimized && <span id="navbar-banner-text">Colony</span>}
            </div>
            <svg onClick={()=>setMinimized(!minimized)} className="navbar-burger" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="0.5" stroke="#425E5F">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
            
            <div className="navbar-items">
                <NavbarItem icon={<DashboardIcon/>} text="Dashboard" minimized={minimized} onClick={() => props.setPage(Page.Dashboard)}/>
                <NavbarItem icon={<FileIcon/>} text="Files" minimized={minimized} onClick={() => props.setPage(Page.Files)}/>
                <NavbarItem icon={<TransactionIcon/>} text="Transactions" minimized={minimized} onClick={() => props.setPage(Page.Transactions)}/>
                <NavbarItem icon={<WalletIcon/>} text="Wallet" minimized={minimized} onClick={() => props.setPage(Page.Wallet)}/>
                <NavbarItem icon={<MiningIcon/>} text="Mining" minimized={minimized} onClick={() => props.setPage(Page.Mining)}/>
            </div>
            <NavbarItem icon={<SettingsIcon/>} text="Settings" minimized={minimized} id="navbar-settings" onClick={() => props.setPage(Page.Settings)}/>
            <hr style={{width: "90%"}}/>
            {!minimized && 
                <div className="navbar-profile">
                    <img className="navbar-profile-img" src={user} alt="" />
                    <div style={{display: "flex", flexDirection: "column"}}>
                        <span style={{fontSize: "15px"}}>Colonist</span>
                        <span style={{fontSize: "12px"}}>9ea*************d9e</span>
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
    icon: React.ReactNode;
    text: string;
    minimized: boolean;
    onClick: () => void;
    id?: string;
}

function NavbarItem(props: ItemProp){
    return(
        <div 
        className="navbar-item" 
        id={props.id ? props.id: ""} 
        onClick={props.onClick}
        tabIndex={0}>
            <div className="navbar-item-logo">{props.icon}</div>
            {!props.minimized && <span className="navbar-item-text">{props.text}</span>}
        </div>
    )
}