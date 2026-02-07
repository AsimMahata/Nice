import { FileInfo } from "./FileAcations";

type Props = {
    handleClick: (value: FileInfo) => void
    file: FileInfo
}
// files and folder items 
// TODO: in future depending on the coding lang we can give different icons
const FileItem = ({ handleClick, file }: Props) => {
    return (
        (<div
            className={file.isDirectory ? "dir" : "file"}
            onClick={
                () => {
                    handleClick(file);
                }
            } >
            {file.isDirectory ? "📁" : "📄"} {file.name} {file.isDirectory ? "/" : ""}
        </div>)
    )
}

export default FileItem
