import React from "react";
import logo from "../images/colony-logo-transparent.png";
import user from "../images/user.png";
import { DashboardIcon, FileIcon, TransactionIcon, WalletIcon, MiningIcon, SettingsIcon, ExitIcon} from "../images/icons/icons";

export default function Navbar(){
    return (
        <div className="navbar-box">
            <div className="navbar-banner">
                <img id="navbar-banner-logo" src={logo} alt="app logo" />
                <span id="navbar-banner-text">Colony</span>
            </div>
            <svg className="navbar-burger" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="0.5" stroke="#425E5F">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
            
            <div className="navbar-items">
                <NavbarItem icon={<DashboardIcon/>} text="Dashboard"/>
                <NavbarItem icon={<FileIcon/>} text="Files"/>
                <NavbarItem icon={<TransactionIcon/>} text="Transactions"/>
                <NavbarItem icon={<WalletIcon/>} text="Wallet"/>
                <NavbarItem icon={<MiningIcon/>} text="Mining"/>
            </div>
            <NavbarItem icon={<SettingsIcon/>} text="Settings" id="navbar-settings"/>
            <hr style={{width: "90%"}}/>
            <div className="navbar-profile">
                <img className="navbar-profile-img" src={user} alt="" />
                <div style={{display: "flex", flexDirection: "column"}}>
                    <span style={{fontSize: "15px"}}>Colonist</span>
                    <span style={{fontSize: "12px"}}>9ea*************d9e</span>
                </div>
                <div className="navbar-profile-exit">
                    <ExitIcon/>
                </div>
            </div>
        </div>
    )
}

interface Props {
    icon: React.ReactNode;
    text: string;
    id?: string;
}

function NavbarItem(props: Props){
    return(
        <div className="navbar-item" id={props.id ? props.id: ""}>
            <div className="navbar-item-logo">{props.icon}</div>
            <span className="navbar-item-text">{props.text}</span>
        </div>
    )
}