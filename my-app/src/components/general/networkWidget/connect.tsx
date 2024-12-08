<<<<<<< HEAD
import { useTheme } from "../../../ThemeContext";

export default function Connect() {
    const  {isDarkMode} = useTheme();
    return (
        <div id = "connection-container" style={(isDarkMode ? {backgroundColor:'#215F64'} : {})}>
            <label htmlFor="networkUrl" style={(isDarkMode ? {color: 'white'} : {})}>Connect To Network</label>
            <br></br>
            <input placeholder="Link" id="networkUrl" type="text"/>
            <input value="Connect" type="submit"/>
        </div>
    );
=======
import { useAppContext } from "../../../AppContext";

export default function Connect() {
    const  {isDarkMode} = useAppContext();
    return (
        <div id = "connection-container" style={(isDarkMode ? {backgroundColor:'#215F64'} : {})}>
            <label htmlFor="networkUrl" style={(isDarkMode ? {color: 'white'} : {})}>Connect To Network</label>
            <br></br>
            <input placeholder="Link" id="networkUrl" type="text"/>
            <input value="Connect" type="submit"/>
        </div>
    );
>>>>>>> main
}