package http

import (
	"log"
	"net/http"
)

func server() {
	// Define the directory to serve files from
	fs := http.FileServer(http.Dir("../uploaded_files"))

	// Route requests to the server
	http.Handle("/", fs)

	// Start the server on port 8080
	log.Println("Serving files on :8080...")
	err := http.ListenAndServe(":8080", nil)
	if err != nil {
		log.Fatal(err)
	}
}
