import { useAtom } from "jotai";
import { userAtom } from "../store/UserAtom";
import { Login as LoginUser } from "../db/users";

export default function Login() {
  const [user, setUser] = useAtom(userAtom);

  const handleLogin = async () => {
    const username = document.querySelector("input[type=text]")?.value;
    const password = document.querySelector("input[type=password]")?.value;
    if (username && password) {
      const user = await LoginUser({ username, password });
      if (user) setUser(user);
    }
  };

  return (
    <main className="container">
      <div>
        <input type="text" placeholder="Username" /><br />
        <input type="password" placeholder="Password" /><br />
        <button onClick={handleLogin}>Login</button>
      </div>
    </main>
  );
}

