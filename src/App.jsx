import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import NavDrawer from "./components/NavDrawer.jsx";
import Home from "./pages/Home.jsx";
import ChooseGear from "./pages/ChooseGear.jsx";
import GearList from "./pages/GearList.jsx";
import GearDetail from "./pages/GearDetail.jsx";

export default function App() {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <>
      <button
        className="nav-toggle"
        aria-label="Open gear menu"
        aria-expanded={navOpen}
        onClick={() => setNavOpen(true)}
      >
        <span /><span /><span />
      </button>

      <NavDrawer open={navOpen} onClose={() => setNavOpen(false)} />

      {/* Main content blurs while the drawer is open (see styles.css) */}
      <main className={navOpen ? "page blurred" : "page"} onClick={() => navOpen && setNavOpen(false)}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/choose" element={<ChooseGear />} />
          <Route path="/gear/:type" element={<GearList />} />
          <Route path="/gear/:type/:id" element={<GearDetail />} />
        </Routes>
      </main>
    </>
  );
}
