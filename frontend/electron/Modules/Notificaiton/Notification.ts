import { Notification } from "electron";

export function showNotification(title: string, body: string) {
    console.log("[Notification] called");
    console.log("[Notification] title:", title);
    console.log("[Notification] body:", body);
    console.log("[Notification] supported:", Notification.isSupported());

    try {
        new Notification({
            title,
            body,
        }).show();

        console.log("[Notification] show() executed");
    } catch (error) {
        console.error("[Notification] failed:", error);
    }
}
