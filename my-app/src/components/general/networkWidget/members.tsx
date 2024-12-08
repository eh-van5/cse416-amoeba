import { UserIcon } from "../../../images/icons/icons"
import { useAppContext } from "../../../AppContext";

interface memberProps {
    name: string;
    theme: boolean;
}

function Member(props: memberProps) {
    return(
        <div style={(props.theme ? {color: 'white'} : {})}>
            <UserIcon />
            {props.name}
        </div>
    )
}

export default function Members() {
    const {isDarkMode} = useAppContext();

    const ms = ["test", "test", "test", "test", "test", "test", "test"]
    const members = ms.map(name => { return Member({name: name, theme: isDarkMode})});
    return (
        <div id = "members" style={(isDarkMode ? {backgroundColor:'#215F64'} : {})}>
            <div id="members-container">
            {members}
            </div>
        </div>
    );
}