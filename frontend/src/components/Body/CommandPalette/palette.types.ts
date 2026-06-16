
export interface paletteItem {
    title: string,
    secondaryTitle?: string,
    icon?: string,
    type: "File" | "Command" | "Theme" | "Settings" | "Unknown", // it can support many things
    payload?: unknown
}
