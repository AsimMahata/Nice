// import { useParams} from "react-router";
import NavButton from "../components/NavigateButton";
import { useAuth } from "../utils/useAuth";

// type RouteParams = {
//   id: string;
// };

export default function Profile() {
  // const { id } = useParams<RouteParams>();
  const {user} = useAuth();
  console.log(user);

  return (
    <div>
      <h1>Profile page {user?.name}</h1>
      <h2>{user?.email}</h2>
      <NavButton to="/" label="Go back to editor (home)"/>
    </div>
  );
}