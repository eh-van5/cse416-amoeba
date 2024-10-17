import Connect from "./connect";
import Members from "./members";

export default function NetworkWidget() {
    return(
        <div id = "network-widget">
            <Connect />
            <Members />
        </div>
    )
}