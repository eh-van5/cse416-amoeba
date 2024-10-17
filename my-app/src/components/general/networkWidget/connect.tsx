export default function Connect() {
    return (
        <div id = "connection-container">
            <label htmlFor="networkUrl">Connect To Network</label>
            <br></br>
            <input placeholder="Link" id="networkUrl" type="text"/>
            <input type="submit"/>
        </div>
    );
}