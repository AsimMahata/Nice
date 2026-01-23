import { FileEntry } from "./FileAcations";

type Props = {
  handleClick: (value: FileEntry) => void
  file: FileEntry
}
// files and folder items 
// TODO: in future depending on the coding lang we can give different icons
const FileItem = ({ handleClick, file }: Props) => {
  return (
    (<div
      className={file.isDir ? "dir" : "file"}
      onClick={
        () => {
          handleClick(file);
        }
      } >
      {file.isDir ? "📁" : "📄"} {file.name} {file.isDir ? "/" : ""}
    </div>)
  )
}

export default FileItem
