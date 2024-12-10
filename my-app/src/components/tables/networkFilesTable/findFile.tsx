import React, { useState } from 'react';
import BuyForm from './buyForm';

function SearchBar() {
  const [searchQuery, setSearchQuery] = useState('');
  const [responseData, setResponseData] = useState<any>({}); 

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
      const response = await fetch(`http://localhost:8000/getFile?contentHash=${searchQuery}`, {
        method: 'GET',
      });

      if (response.ok) {
        const data = await response.json(); 

        setResponseData(data);
    
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
      <h2>Find Providers Using Content Hash</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={searchQuery}
          onChange={handleChange}
          placeholder="Enter file hash"
          required
        />
        <button type="submit">Buy</button>
      </form>
      <BuyForm hostToFile={responseData} />
    </div>
  );
}

export default SearchBar;
