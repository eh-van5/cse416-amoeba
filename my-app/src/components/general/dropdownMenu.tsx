import React, { useEffect, useState, useRef } from 'react';

interface dropdownMenuProps {
    isVisible: boolean;
    menuItems: {label: string; onClick: () => void}[];
    buttonRef?: React.RefObject<HTMLDivElement>;
    onClose: () => void;
}

const DropdownMenu: React.FC<dropdownMenuProps> = ({
    isVisible,
    menuItems,
    buttonRef,
    onClose
}) => {
    const [position, setPosition] = useState<{top?: string; left?: string}>({});
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (buttonRef && buttonRef.current && isVisible) {
            const buttonRect = buttonRef.current.getBoundingClientRect();
            const offset = menuRef.current? menuRef.current.getBoundingClientRect().width : 0;
            const containerRect = buttonRef.current.offsetParent?.getBoundingClientRect();
            if(containerRect) {
                setPosition({
                    top: `${buttonRect.bottom - containerRect.top}px`,
                    left: `${buttonRect.right - containerRect.left - offset}px`
                });
            }else {
                setPosition({
                    top: `${buttonRect.bottom + window.scrollY}px`,
                    left: `${buttonRect.right + window.scrollX - offset}px`, // Let menu is located just to the left of the button
                });
            }
        }
    }, [buttonRef, isVisible]);

    // Listen to mouse event to determine whether clicked and close the menu
    useEffect(() => {
        const handleClick = (event: MouseEvent) => {
            if(menuRef.current && !menuRef.current.contains(event.target as Node) && buttonRef?.current 
                && !buttonRef.current.contains(event.target as Node)) {
                    onClose();
                }
        };
        document.addEventListener('mousedown', handleClick);
        return () => {
            document.removeEventListener('mousedown', handleClick);
        };
    }, [onClose, buttonRef]);

    return (
        <div ref={menuRef} className={`dropdown-menu ${isVisible ? 'show' : ''}`}  style={{...position, position: 'absolute'}}>
            <ul>
                {menuItems.map((item, index) => (
                    <li key={index} onClick={() => {item.onClick(); onClose()}}>
                        {item.label}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default DropdownMenu;