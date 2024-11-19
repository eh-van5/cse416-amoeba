import { useEffect, useRef, useCallback, useState } from 'react';

const useWebSocket = (url: string, setMessage: (message: string) => void) => {
    const wsRef = useRef<WebSocket | null>(null);
    const [connected, setConnected] = useState<boolean>(false);

    useEffect(() => {
        const socket = new WebSocket(url);
        socket.onopen = () => {
            console.log("WebSocket connected");
            setConnected(true);
        };

        socket.onmessage = (event) => {
            //console.log("Message from server: ", event.data);
            setMessage(event.data);
        };

        socket.onerror = (error) => {
            console.error("WebSocket error: ", error);
        };

        socket.onclose = () => {
            console.log("WebSocket disconnected");
            setConnected(false);
        };

        wsRef.current = socket;

        return () => {
            socket.close();
        };
    }, [url]);

    const sendMessage = useCallback((msg: string) => {
        const socket = wsRef.current;
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(msg);
            // console.log("Sent message:", msg);
        } else {
            console.error("WebSocket is not open.");
        }
    }, []);

    // Return the sendMessage function and WebSocket ref (so caller can access it)
    return { sendMessage, wsRef };
};

export {useWebSocket}