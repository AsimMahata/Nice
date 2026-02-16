import { Notification } from 'electron';

export function showNotification(title: string, body: string) {
    new Notification({
        title,
        body,
    }).show();
}
