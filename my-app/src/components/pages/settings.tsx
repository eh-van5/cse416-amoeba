import { useState } from "react";
import { Dispatcher } from "../../App";
import { SunIcon, MoonIcon } from "../../images/icons/icons"
import ToggleSwitch from "../general/toggle";

enum Tab{
    Appearance,
    Notifications
}

interface SettingsProps{
    isDarkMode: boolean;
    setDarkMode: Dispatcher<boolean>;
}

export default function SettingsPage(props: SettingsProps){
    const[currentTab, setCurrentTab] = useState<Tab>(Tab.Appearance);

    // All tabs as an array of strings
    const tabs = Object.keys(Tab).filter((v) => isNaN(Number(v)));

    console.log("is dark mode", props.isDarkMode);

    return(
        <div className="page-content">
            <h1>Settings</h1>
            <div className="box-container" style={{height: "82vh", padding: "20px 30px"}}>
                <div className="settings-header">
                    {
                        tabs.map((e) => <TabItem text={e} currentTab={currentTab} setCurrentTab={setCurrentTab}/>)
                    }
                </div>
                <div className="settings-content">
                    {
                        ({
                            [Tab.Appearance]: <AppearanceTab isDarkMode={props.isDarkMode} setDarkMode={props.setDarkMode}/>,
                            [Tab.Notifications]: <NotificationTab/>,
                        })[currentTab]
                    }
                    
                </div>
            </div>
        </div>
    )
}

interface TabItemProps{
    text: string;
    currentTab: Tab;
    setCurrentTab: Dispatcher<Tab>;
}

interface AppearanceTabProps{
    isDarkMode: boolean;
    setDarkMode: Dispatcher<boolean>;
}

function TabItem(props: TabItemProps){
    return (
        <span 
        className="settings-tab"
        tabIndex={0}
        onClick={() => props.setCurrentTab(Tab[props.text as keyof typeof Tab])}
        style={{color: Tab[props.currentTab] === props.text ? "black" : "#bdbdb4"}}>{props.text}
        </span>
    )
    
}

function AppearanceTab(props: AppearanceTabProps){
    return(
        <>
            <span className="settings-text">Personalize your app experience by customizing its look and feel. Adjust themes and colors to match your style.</span>
            <span className="settings-subheader">Theme</span>
            <span className="settings-text">Select a theme for your Colony application.</span>

            <div style={{display: "flex", alignItems: "center", gap: "60px", padding: "30px"}}>
                <div className="theme-button"
                onClick={() => props.setDarkMode(false)}
                style={{color: !props.isDarkMode ? "#efe896" : "#bdbdb4"}}>
                    <SunIcon/>
                </div>
                <div className="theme-button"
                onClick={() => props.setDarkMode(true)}
                style={{color: props.isDarkMode ? "#a87bef" : "#bdbdb4", width: "40px"}}>
                    <MoonIcon/>
                </div>
            </div>
        </>
    )
}

function NotificationTab(){
    function Checkbox(name: string, idname: string){
        return (
        <label style={{display: "flex", alignItems: "center", padding: "5px 30px"}} htmlFor={`notification-${idname}`}>
            <input type="checkbox" className="notification-checkbox" id={`notification-${idname}`}/>
            <span style={{padding: "0 5px", fontSize: "12px"}}>{name}</span>
        </label>
        )
    }

    return (
        <>
            <span className="settings-text">
            Control how and when you receive notifications. Customize alerts for messages, updates, and activity to stay informed without the noise. Choose what’s important and set preferences
            for in-app notifications.
            </span>
            <span className="settings-subheader">Notifications</span>
            <span className="settings-text">Turn notifications on/off</span>
            <div style={{padding: "10px 30px"}}>
                <ToggleSwitch name="toggle-notifications" offText="Off" onText="On"/>
            </div>
            <div className="notification-choice">
                <span className="settings-subheader">Notify me about...</span>
                <span className="settings-text">Choose what notifications you receive</span>
                {Checkbox("File Updates","file-updates")}
                {Checkbox("Transactions","transactions")}
                {Checkbox("Wallet Updates","wallet-updates")}
                {Checkbox("Coin Mining","coin-mining")}
            </div>
        </>
    )
}