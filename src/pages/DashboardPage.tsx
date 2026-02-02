import { useSession } from "../context/SessionContext";
import supabase from "../supabase";

const DashboardPage = () => {
  const { session } = useSession();

  return (
    <main className="main-container">
      <h1 className="header-text">Dashboard</h1>
      <p>{session?.user.email}</p>
      <button onClick={() => supabase.auth.signOut()}>Sign Out</button>
    </main>
  );
};

export default DashboardPage;
