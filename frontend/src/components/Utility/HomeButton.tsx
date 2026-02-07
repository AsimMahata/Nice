import { useNavigate } from "react-router-dom";
import { Home } from "lucide-react";

const HomeButton = () => {
    const navigate = useNavigate();

    return (
        <button
            onClick={() => navigate("/")}
            className="
        fixed top-4 right-4 z-50
        flex items-center gap-2
        rounded-full
        bg-white/90 backdrop-blur
        px-4 py-2
        text-gray-800
        shadow-lg shadow-black/10
        border border-gray-200

        hover:bg-gray-100
        hover:shadow-xl
        active:scale-95

        transition-all duration-200
      "
            aria-label="Go to home"
        >
            <Home size={18} className="text-gray-700" />
            <span className="text-sm font-semibold">Home</span>
        </button>
    );
};

export default HomeButton;
