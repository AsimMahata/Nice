import { useState } from "react";


// this is used to NOTIFY user about various errors , and permission limitations 
// NOTE: the css needs to be fixed 
// NOTE: curretly its getting returned from File-Explorer taost && {component} have to bring it to app

export function useToast() {
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  }

  return { toast, showToast };
}
