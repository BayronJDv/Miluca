import "./App.css";
import { useAtom } from "jotai";
import { userAtom } from "./store/UserAtom";
import  Login  from "./components/Login/Login";
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from "./components/Sidebar";
import TopNav from "./components/TopNav";
import FAB from "./components/FAB/FAB";
import Home from "./pages/Home";
import Pos from "./pages/Pos";
import Inventario from "./pages/Inventario";


function App() {
  const [user, setUser] = useAtom(userAtom);

  if (user) {
    return (
      <BrowserRouter>
        <div className="bg-background text-on-background min-h-screen flex">
          <Sidebar />
          <main className="ml-64 flex-1 flex flex-col min-h-screen">
            <TopNav />
            <div className="mt-16 p-lg space-y-lg overflow-y-auto">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/pos" element={<Pos />} />
                <Route path="/inventario" element={<Inventario />} />
              </Routes>
            </div>
          </main>
        </div>
      </BrowserRouter>
    );
  }

  return (
    <main className="container">
      <Login />
    </main>
  );
}

export default App;
