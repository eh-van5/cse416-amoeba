import React, { useCallback, useEffect, useState } from "react";

const useWebSocket = (url: string) => {
    const [ws, setWs] = useState<WebSocket | null>(null);


    useEffect(() => {
        const socket = new WebSocket(url);
        socket.onopen = () => {
            console.log("Websocket connected");
        };

        socket.onmessage = (event) => {
            console.log("Message from server: ", event.data);
        };

        socket.onerror = (error) => {
            console.error("WebSocket error: ", error);
        };

        socket.onclose = () => {
            console.log("WebSocket disconnected");
        };

        setWs(socket);
        return () => {
            socket.close();
        };
    }, [url]);

    const sendMessage = useCallback(( msg: string ) => {
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(msg);
            console.log("Sent message:", msg);
        }
    }, [ws]);

    return sendMessage;
};

export { useWebSocket };