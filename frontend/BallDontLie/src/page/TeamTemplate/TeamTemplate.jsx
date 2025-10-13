import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { teams } from "../../data/teams.js";
import { players } from "../../data/players.js"; // <--- добавляем
import styles from "./TeamTemplate.module.css";

export default function TeamTemplate() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSearchClosing, setIsSearchClosing] = useState(false);

  const team = teams.find(t => t.id === Number(id));

  function handleSearch() {
    if (!search.trim()) return alert("Type NBA Player");

    const term = search.toLowerCase();
    const player = players.find(p => p.name.toLowerCase().includes(term));

    if (player) {
      navigate(`/player/${player.id}`);
      return;
    }

    alert("Not found. Try again.");
  }

  function closeSearchOverlay() {
    setIsSearchClosing(true);
    setTimeout(() => {
      setIsSearchOpen(false);
      setIsSearchClosing(false);
    }, 200);
  }

  function handleOverlayClick(e) {
    if (e.target.classList.contains(styles.overlay)) {
      closeSearchOverlay();
    }
  }

  // Close overlay on Escape
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape" && isSearchOpen) closeSearchOverlay();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSearchOpen]);

  return (
    <div className={styles.body}>
      {/* Navbar */}
      <header className={styles.navbar}>
        <button className={styles.logoBtn} onClick={() => navigate("/")}>
          <img src="/WEB-Logo/Basketball.png" alt="img" className={styles.WebLogo} />
          Ball Don't Lie
        </button>

        <div className={styles.navButtons}>
          <button className={styles.btn} onClick={() => navigate("/teams")}>
            <img src="/NavBar_icon/Team.png" alt="img" className={styles.btnIcon} />
            Teams
          </button>

          <button className={styles.btn} onClick={() => navigate("/players")}>
            <img src="/NavBar_icon/Player.png" alt="img" className={styles.btnIcon} />
            Players
          </button>

          <button className={styles.btn} onClick={() => setIsSearchOpen(true)}>
            <img src="/NavBar_icon/search.svg" alt="img" className={styles.btnIcon} />
            Search
          </button>
        </div>
      </header>

      <div className={styles.container}>
        <section className={styles.leftSide}>
          <table className={styles.infoTable}>
            <tbody>
              <tr>
                <td colSpan="2" className={styles.teamName}>
                  {team.full_name}
                </td>
              </tr>

              <tr>
                <td colSpan="2" className={styles.teamPhotoCell}>
                  <img src={team.logo} className={styles.teamPhoto} alt={team.name} />
                </td>
              </tr>

              <tr><td>City:</td><td>{team.city}</td></tr>
              <tr><td>Conference:</td><td>{team.conference}</td></tr>
              <tr><td>Division:</td><td>{team.division}</td></tr>
              <tr><td>Founded:</td><td>{team.founded}</td></tr>
              <tr><td>Arena:</td><td>{team.arena}</td></tr>
              <tr><td>Head Coach:</td><td>{team.coach}</td></tr>
              <tr><td>Owner:</td><td>{team.owner}</td></tr>
              <tr><td>Championships:</td><td>{team.championships}</td></tr>
            </tbody>
          </table>
        </section>

      </div>




      {/* Search overlay */}
      {
        (isSearchOpen || isSearchClosing) && (
          <div
            className={`${styles.overlay} ${isSearchClosing ? styles.close : ""}`}
            onClick={handleOverlayClick}
          >
            <div className={`${styles.searchBox} ${isSearchClosing ? styles.close : ""}`}>
              <input
                type="text"
                placeholder="Search player..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                autoFocus
              />
            </div>
          </div>
        )
      }
    </div >
  );
}
