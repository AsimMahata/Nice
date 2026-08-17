declare global {
    interface Window {
        notify: {
            send(title: string, body: string): Promise<void>;
        };
    }
}
export const notify = {
    async success(title: string, body: string) {
        await window.notify.send(title, body);
    },

    async error(title: string, body: string) {
        await window.notify.send(title, body);
    },

    async info(title: string, body: string) {
        await window.notify.send(title, body);
    },
};
