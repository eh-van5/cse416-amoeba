import React, { Dispatch, SetStateAction } from "react";
import logo from "../images/colony-logo-transparent.png";
import user from "../images/user.png";
import { DashboardIcon, FileIcon, TransactionIcon, WalletIcon, MiningIcon, SettingsIcon, ExitIcon} from "../images/icons/icons";
import { Page } from "../App";

type Dispatcher<S> = Dispatch<SetStateAction<S>>;

interface NavbarProps{
    setPage: Dispatcher<Page>;
}

export default function Navbar(props: NavbarProps){
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
                <NavbarItem icon={<DashboardIcon/>} text="Dashboard" onClick={() => props.setPage(Page.Dashboard)}/>
                <NavbarItem icon={<FileIcon/>} text="Files" onClick={() => props.setPage(Page.Files)}/>
                <NavbarItem icon={<TransactionIcon/>} text="Transactions" onClick={() => props.setPage(Page.Transactions)}/>
                <NavbarItem icon={<WalletIcon/>} text="Wallet" onClick={() => props.setPage(Page.Wallet)}/>
                <NavbarItem icon={<MiningIcon/>} text="Mining" onClick={() => props.setPage(Page.Mining)}/>
            </div>
            <NavbarItem icon={<SettingsIcon/>} text="Settings" id="navbar-settings" onClick={() => props.setPage(Page.Settings)}/>
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

interface ItemProp {
    icon: React.ReactNode;
    text: string;
    onClick: () => void;
    id?: string;
}

function NavbarItem(props: ItemProp){
    return(
        <div className="navbar-item" id={props.id ? props.id: ""} onClick={props.onClick}>
            <div className="navbar-item-logo">{props.icon}</div>
            <span className="navbar-item-text">{props.text}</span>
        </div>
    )
}