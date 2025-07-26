import type React from "react";
import { Link } from "react-router-dom";
import { routesApp } from "../../router";
import styles from "./home.module.scss";

export const HomePage: React.FC = () => {
  return (
    <div className={styles.rootHomePage}>
      <h1 aria-describedby="h1">Welcome to My Graphics Web! 📊</h1>
      <p id="h1" className="sr_only">
        press in the graphics are you interesting for read the data
      </p>
      <div className={`centerRow btnPrimary_01 ${styles.containerAnchors}`}>
        <Link to={""}>Pie Charts</Link>
        <Link to={routesApp?.bars_graphic}>Bars Charts</Link>
      </div>
    </div>
  );
};
