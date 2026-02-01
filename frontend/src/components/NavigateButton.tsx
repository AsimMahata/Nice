import { useNavigate } from "react-router-dom";

interface NavButtonProps {
  to: string;
  label: string;
}

const NavButton = ({ to, label }: NavButtonProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(to);
  };

  return (
    <button 
      onClick={handleClick}
      style={{
        padding: "10px 20px",
        cursor: "pointer",
        borderRadius: "5px",
        backgroundColor: "#007bff",
        color: "white",
        border: "none"
      }}
    >
      {label}
    </button>
  );
};

export default NavButton;