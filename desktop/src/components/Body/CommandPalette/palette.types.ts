
export interface paletteItem {
    title: string,
    secondaryTitle?: string,
    icon?: string,
    type: "File" | "Command" | "Theme" | "Settings" | "Language" | "Unknown", // it can support many things
    payload?: unknown,
    onSelect?: () => void | Promise<void>
}
