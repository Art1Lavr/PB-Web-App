import { useNavigate } from "react-router-dom";
import { teams } from "../../data/teams.js"; 
import styles from "./TeamsPage.module.css";
import { useState, useEffect } from "react";

export default function TeamsPage() {
  const navigate = useNavigate();

  const east = teams.filter(t => t.conference === "East");
  const west = teams.filter(t => t.conference === "West");
  const [search, setSearch] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false); // overlay
  const [isSearchClosing, setIsSearchClosing] = useState(false); 
  
    function handleSearch() {
      if (!search.trim()) return alert("Type NBA Player");
  
      const term = search.toLowerCase();
  
      const player = players.find(
        p =>
          p.name.toLowerCase().includes(term)
      );
      if (player) {
        navigate(`/player/${player.id}`);
        return;
      }
  
      alert("Not found. Try again.");
    }
  
    // Close when press Escape
    useEffect(() => {
      function handleKeyDown(e) {
        if (e.key === "Escape" && isSearchOpen) closeSearchOverlay();
      }
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isSearchOpen]);
  
    //  open menu
    function handleOverlayClick(e) {
      if (e.target.classList.contains(styles.overlay)) {
        closeSearchOverlay();
      }
    }
  
    function closeSearchOverlay() {
      setIsSearchClosing(true);
      setTimeout(() => {
        setIsSearchOpen(false);
        setIsSearchClosing(false);
      }, 200);
    }

  return (
    <div className={styles.body}> {/* Page background container */}
      {/* Navbar */}
      <header className={styles.navbar}>
        <button className={styles.logoBtn} onClick={() => navigate("/")}>
          <img src="/WEB-Logo/Basketball.png" alt="img" className={styles.WebLogo} />
          Ball Don't Lie
        </button>

        <div className={styles.navButtons}> {/* Navigation buttons */}
        
          <button className={styles.btn} onClick={() => navigate("/teams")}>
            <img src="/NavBar_icon/Team.png" alt="img" className={styles.btnIcon} />
            Teams
          </button>

          <button className={styles.btn} onClick={() => navigate("/players")}>
            <img src="/NavBar_icon/Player.png" alt="img" className={styles.btnIcon} />
            Players
          </button>

          {/* Кнопка Search с оверлеем */}
          <button
            className={styles.btn}
            onClick={() => setIsSearchOpen(true)}
          >
            <img src="/NavBar_icon/search.svg" alt="img" className={styles.btnIcon} />
            Search
          </button>
        </div>
      </header>  

      <div className={styles.conferences}>
        <section className={styles.conference}>
          <h2 className={styles.conferenceTitle}>Eastern Conference</h2>
          <div className={styles.teamsGrid}>
            {east.map(team => (
              <div
                key={team.id}
                className={styles.teamCard}
                onClick={() => navigate(`/team/${team.id}`)}
              >
                <img
                  src={team.logo}
                />
                <p>{team.full_name}</p>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.conference}>
          <h2 className={styles.conferenceTitle }>Western Conference</h2>
          <div className={styles.teamsGrid}>
            {west.map(team => (
              <div
                key={team.id}
                className={styles.teamCard}
                onClick={() => navigate(`/team/${team.id}`)}
              >
                <img
                  src={team.logo}
                />
                <p>{team.full_name}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className={styles.footer}>
        This site is under development. 
        <br/> If you have any suggestions or encounter any errors while using this site, please contact me by email aalavrynets@gmail.com. 
        <br/>Thank you for your feedback.
      </footer>
      {/* Search overlay */}
      {(isSearchOpen || isSearchClosing) && (
        <div className={`${styles.overlay} ${isSearchClosing ? styles.close : ""}`} onClick={handleOverlayClick}>
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
      )}
    </div>
  );
}