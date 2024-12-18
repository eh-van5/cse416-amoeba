import React, { useState } from 'react';
import { FileInfo } from '../types';
interface SearchBarProps{
  setHostToFile: React.Dispatch<React.SetStateAction<{} | Record<string, FileInfo>>>
}
function SearchBar({setHostToFile} : SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const PORT = 8088; 

  // Handle input change
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  // Handle form submission
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!searchQuery.trim()) {
      alert("Please enter a valid search query.");
      return;
    }

    try {
      const response = await fetch(`http://localhost:${PORT}/getFile?contentHash=${searchQuery}`, {
        method: 'GET',
      });

      if (response.ok) {
        let data = await response.json(); 
        if (data == null) data = {}
        setHostToFile(data);
    
        console.log(Array.from(Object.keys(data))); 
        const purchaseForm : HTMLDialogElement = document.getElementById("purchase-form") as HTMLDialogElement;
        if (purchaseForm !== null) {
            purchaseForm.showModal();
        }

      } else {
        alert("Error fetching search results.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error occurred while fetching data.");
    }
  };
  return (
    <div>
      <form id = "search-bar" onSubmit={handleSubmit}>
        <button className = "search-bar-items" type="submit">Buy</button>
        <input
          className = "search-bar-items"
          type="text"
          value={searchQuery}
          onChange={handleChange}
          placeholder="Enter file hash"
          required
        />
      </form>
    </div>
  );
}

export default SearchBar;
