import type React from "react";
import "./home.styles.scss";

export const HomePage: React.FC = () => {
  return (
    <div className="rootHomePage">
      <h1 tabIndex={0} aria-label={"Welcome!"}>
        Welcome!
      </h1>
      <img
        loading="lazy"
        src={`${import.meta.env.BASE_URL}assets/images/gato-2.jpg`}
        alt="Main images, personal image"
      />
    </div>
  );
};
