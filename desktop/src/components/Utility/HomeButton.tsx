import { useNavigate } from "react-router-dom";
import { X, Home } from "lucide-react";

interface HomeButtonProps {
    onClose?: () => void;
}

const HomeButton: React.FC<HomeButtonProps> = ({ onClose }) => {
    const navigate = useNavigate();

    const handleClick = () => {
        if (onClose) {
            onClose();
        } else {
            navigate("/");
        }
    };

    return (
        <button
            onClick={handleClick}
            className="auth-close-floating-btn"
            aria-label="Close and return to editor"
            title="Close (Esc)"
        >
            <X size={18} />
            <span className="auth-close-text">Close</span>
            <kbd className="auth-esc-kbd">Esc</kbd>
        </button>
    );
};

export default HomeButton;

