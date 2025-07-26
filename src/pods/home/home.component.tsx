import type React from "react";
import "./home.styles.scss";

export const HomePage: React.FC = () => {
  return (
    <div className="rootHomePage">
      <h1 aria-describedby="h1" tabIndex={0} aria-label={"Welcome!"}>
        Welcome to My Graphics Web! 📊
      </h1>
      <p id="h1" className="sr_only">
        press in the graphics are you interesting for read the data
      </p>
      <img
        loading="lazy"
        src={`${import.meta.env.BASE_URL}assets/images/gato-2.jpg`}
        alt="cat image"
      />
    </div>
  );
};
