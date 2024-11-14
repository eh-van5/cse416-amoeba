package http

import (
	"fmt"
	"io"
	"net/http"
	"os"
)

func client(hash string) {
	url := "http://localhost:8080/" + hash
	response, err := http.Get(url)
	if err != nil {
		fmt.Println("Error fetching file:", err)
		return
	}
	defer response.Body.Close()

	// Create a file to save the downloaded data
	outFile, err := os.Create(hash)
	if err != nil {
		fmt.Println("Error creating file:", err)
		return
	}
	defer outFile.Close()

	// Write the file contents to disk
	_, err = io.Copy(outFile, response.Body)
	if err != nil {
		fmt.Println("Error saving file:", err)
		return
	}

	fmt.Println("File downloaded successfully!")
}
