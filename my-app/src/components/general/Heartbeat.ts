let interval: NodeJS.Timeout | null = null;
const POLLING_INTERVAL = 5000;

export const startHeartbeat = async () => {
    if(interval !== null) return;

    interval = setInterval(async () => {
        try {
            await fetch("http://localhost:8088/heartbeat", { method: "POST" });
            console.log("Heartbeat sent");
        }catch (error) {
            console.error("Failed to send heartbeat:", error);
        }
    }, POLLING_INTERVAL);

    console.log("Heartbeat started");
};

export const stopHeartbeat = () => {
    if(interval !== null) {
        clearInterval(interval);
        interval = null;
        console.log("Heartbeat stopped");
    }
};