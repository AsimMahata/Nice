import axios, { AxiosError, AxiosResponse } from "axios";
import "../styles/EditorControls.css";
import React, { useState } from "react";
import LangDropDown from "./LangDropDown";
import { useAuth } from "../utils/useAuth";
import NavButton from "./NavigateButton";
import { useNavigate } from "react-router-dom";


type Props = {
<<<<<<< HEAD
    code: string;
    output: string;
    setOutput: React.Dispatch<React.SetStateAction<string>>;
    error: string;
    setError: React.Dispatch<React.SetStateAction<string>>;
    setRunning: React.Dispatch<React.SetStateAction<boolean>>;
    setAiResponse: React.Dispatch<React.SetStateAction<string>>;
    input: string;
    setSavingCode: React.Dispatch<React.SetStateAction<boolean>>;
    lang: string;
    _setLang: React.Dispatch<React.SetStateAction<string>>;
    showFileEx: boolean;
    setShowFileEx: React.Dispatch<React.SetStateAction<boolean>>;
};
=======
    code: string
    output: string
    setOutput: React.Dispatch<React.SetStateAction<string>>
    error: string
    setError: React.Dispatch<React.SetStateAction<string>>
    setRunning: React.Dispatch<React.SetStateAction<boolean>>
    setAiResponse: React.Dispatch<React.SetStateAction<string>>
    input: string
    setSavingCode: React.Dispatch<React.SetStateAction<boolean>>,
    lang: string,
    setLang: React.Dispatch<React.SetStateAction<string>>
    showFileEx: boolean,
    setShowFileEx: React.Dispatch<React.SetStateAction<boolean>>
}
>>>>>>> 489da82 (add language change)
type code = {
    code: string;
    lang: string;
    input: string;
};

type status = {
    success: boolean;
    output: string;
    error: string;
    runtimeError: string;
    compilationError: string;
};
// the main controler of all the actions which happens to code name is bad
// NOTE: there are so much stuff here have to move them to a utils section

const ControlPanel = (props: Props) => {
    const [hasError, setHasError] = useState(false); // whether running or compililation has generated any error it is used to trigger getAIHELP button

    // trigger save code function in NOTE: fileaction.ts

    const saveCode = async () => {
        console.log("code saved");
        console.log(props.code);
        props.setSavingCode((p) => !p);
    };
    const getAiHelp = async () => {
        if (!props.error) return;

        const errObj = {
            error: props.error,
            type: "comile time error",
        };

        const url: string = `${import.meta.env.VITE_API_URL}/ai/help`;

        await axios
            .post(url, errObj)
            .then((res: AxiosResponse) => {
                props.setAiResponse(res.data);
            })
            .catch((err) => {
                console.error(
                    "sometehing error occured with GROQ/AI so cant help sad 🥲 \n",
                    err,
                );
            })
            .finally(() => setHasError(false));
    };

    // NOTE: smamaj lena 🥲
    const runCode = async () => {
        // the things thats need to be sent in backend
        const payload: code = {
            code: props.code,
            lang: props.lang,
            input: props.input,
        };

        props.setOutput("No Output"); //  before running set output to default
        props.setAiResponse(""); //  ai response to empty

        const url: string = `${import.meta.env.VITE_API_URL}/${payload.lang}/run`;
        console.log("EditorControls", "runCode", url);
        props.setRunning(true); // WARN: every props is getting used in the format props.VAR needs to be { separated }

        await axios
            .post<status>(url, payload)
            .then((res: AxiosResponse) => {
                props.setError(res?.data?.error);
                props.setOutput(res?.data?.output);
                console.log(res);
            })
            .catch((err: AxiosError<status>) => {
                const error = String(err.response?.data?.error);
                props.setOutput("Something Went Wrong ...");
                props.setError(error);
                setHasError(true);
                setTimeout(() => setHasError(false), 3000);

                console.error(err);
            })
            .finally(() => {
                props.setRunning(false);
            });
    };

    // TODO: still havent implemented

    const compileCode = () => {
        const code = props.code;
        console.log(code);
    };

<<<<<<< HEAD
    const { user, refreshAuth } = useAuth();
    console.log(user);

    const navigate = useNavigate();

    const handleLogOut = async () => {
        try {
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/auth/logout`,
                {},
                {
                    withCredentials: true,
                },
            );

            if (response.status === 200) {
                localStorage.removeItem("user");

                refreshAuth();

                navigate("/");

                console.log("Logged out successfully");
            }
        } catch (error) {
            const err = error as Error;
            console.error("Logout failed:", err.message);
        }
    };
=======
    const { user } = useAuth();
>>>>>>> 489da82 (add language change)

    return (
        <div className="EditorControlsContainer">
            <button onClick={() => props.setShowFileEx((prev) => !prev)}>
                {!props.showFileEx ? "Open" : "Close"}Files
            </button>
            <button onClick={runCode}>Run</button>
            <button onClick={compileCode}>Compile</button>
            <button onClick={saveCode}>SaveCode</button>
<<<<<<< HEAD
            <button
                onClick={getAiHelp}
                className={`ai-btn ${hasError ? "ai-btn-error" : ""}`}>
                Get AI Help
            </button>
            <LangDropDown lang={props.lang} _setLang={props._setLang} />
            {user && <NavButton to={`/user/${user?._id}`} label="Profile" />}{/*Later update it*/}
            {!user && <NavButton to="/login" label="Login" />}
            {!user && <NavButton to="/register" label="Register" />}
            {user && <button onClick={handleLogOut}>Log out</button>}
=======
            <button onClick={getAiHelp}
                className={`ai-btn ${hasError ? "ai-btn-error" : ""}`}
            >Get AI Help</button>
            <NavButton to="/login" label="Login" />
            <NavButton to="/register" label="Register" />
>>>>>>> 489da82 (add language change)
        </div>
    );
};

export default ControlPanel
