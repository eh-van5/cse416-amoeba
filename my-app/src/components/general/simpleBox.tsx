import { ThreeDotIcon } from "../../images/icons/icons";
import { useAppContext } from "../../AppContext";

interface simpleBoxProps {
    title: string;
    style?: React.CSSProperties;
    children?: React.ReactNode;
    dotIcon?:boolean;
}

const SimpleBox: React.FC<simpleBoxProps> = ({title, style, children,dotIcon = false}) => {
    const {isDarkMode} = useAppContext();
    return (
        <div className={`box-container${isDarkMode ? '-dark' : ''}`} style={style}>
            <div className="box-header">
                <h3 className="box-title">{title}</h3>
                {dotIcon === true && (
                <div className="box-header-button">
                    <ThreeDotIcon />
                </div>
                )}    
            </div>
            {children}
        </div>
    );
}

export default SimpleBox;