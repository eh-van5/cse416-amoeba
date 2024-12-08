interface ToggleSwitchProps{
    name: string;
    offText: string;
    onText: string;
    checked: boolean;
    onClick: () => void;
}

export default function ToggleSwitch(props: ToggleSwitchProps){
    return(
        <label className="toggle-switch" htmlFor={props.name}>
            <input 
            type="checkbox"
            className="toggle-switch-checkbox"
            id={props.name}
            checked={props.checked}
            onChange={props.onClick}
            />
            <span className="toggle-switch-slider"/>
        </label>
    )
}