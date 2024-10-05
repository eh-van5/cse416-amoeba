interface ToggleSwitchProps{
    name: string;
    offText: string;
    onText: string;
}

export default function ToggleSwitch(props: ToggleSwitchProps){
    return(
        <label className="toggle-switch" htmlFor={props.name}>
            <input 
            type="checkbox"
            className="toggle-switch-checkbox"
            id={props.name}
            />
            <span className="toggle-switch-slider"/>
        </label>
    )
}