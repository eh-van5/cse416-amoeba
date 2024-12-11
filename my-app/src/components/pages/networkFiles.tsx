import { useAppContext } from "../../AppContext";
import NetworkFilesTable from "../tables/networkFilesTable/networkFiles";
import SearchBar from "../general/searchBar";
import BuyForm from "../tables/networkFilesTable/buyForm";
import { FileInfo } from "../types";
import React, { useState } from "react";

interface NumberDropdownProps {
    k: number, 
    setK: React.Dispatch<React.SetStateAction<number>>;
}
const NumberDropdown = ({k, setK}: NumberDropdownProps) => {
  const intervals = [1, 5, 10, 20, 30, 40, 50, 75, 100];

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setK(Number(event.target.value));
  };

  return (
    <select
    id="number-dropdown"
    value={k}
    onChange={handleChange}
    >
    {intervals.map((number) => (
        <option key={number} value={number}>
        {number}
        </option>
    ))}
    </select>
  );
};


export default function NetworkFilesPage(){
    const headings = ["", "Name", "Last Modified", "Size"];
    // pull items from backend
    const [hostToFile, setHostToFile] = useState<Record<string, FileInfo> | {}>({})
    const [k, setK] = useState<number>(5);
    const {isDarkMode} = useAppContext();

    return(
        <div className="page-content">
            <div className="page-file-header"> 
                <p style={{ color:isDarkMode ? 'white' : 'black'}}>Purchase Files using Content Hash</p>
            </div>            
            <hr></hr>
            <div id = "top-widgets">
                <SearchBar setHostToFile={setHostToFile}/>
            </div>
            <br></br>
            <hr></hr>
            <div className="page-file-header"> 
                <p style={{ color:isDarkMode ? 'white' : 'black'}}>Explore <NumberDropdown k = {k} setK = {setK} /> Peers</p>
            </div>
    
            <NetworkFilesTable headings={headings} setHostToFile={setHostToFile} k = {k}/>
            <BuyForm hostToFile={hostToFile}/>
        </div>
    )
}