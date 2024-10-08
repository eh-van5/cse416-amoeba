import { UserIcon } from "../../../images/icons/icons"

interface memberProps {
    name: string;
}

function Member({name}: memberProps) {
    return(
        <div>
            <UserIcon />
            {name}
        </div>
    )
}

export default function Members() {
    const ms = ["test", "test", "test", "test", "test", "test", "test"]
    const members = ms.map(name => { return Member({name})});
    return (
        <div id="members-container">
            {members}
        </div>
    );
}