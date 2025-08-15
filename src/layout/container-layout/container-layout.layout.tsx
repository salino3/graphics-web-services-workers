import React, { useEffect, useState } from "react";
import "./container-layout.style.scss";

interface Props {
  children: React.ReactNode;
}

export const ContainerLayout: React.FC<Props> = ({ children }) => {
  const [isOnline, setIsOnline] = useState<string>("You are now offline.");
  const [visible, setVisible] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline("You are back online!");
      setVisible(true);
      setTimeout(() => setVisible(false), 2500);
    };

    const handleOffline = () => {
      setIsOnline("You are now offline.");
      setVisible(true);
      setTimeout(() => setVisible(false), 2500);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <div className="rootContainerLayout">
      <span className={`popupOnLine ${visible ? "show" : ""}`}>
        {isOnline}🛜{" "}
        {!navigator.onLine && (
          <svg width="22" height="24" viewBox="0 0 64 64" className="lineIcon">
            <line
              x1="16"
              y1="16"
              x2="48"
              y2="48"
              stroke="#f44336"
              strokeWidth="9"
              strokeLinecap="round"
            />
          </svg>
        )}
      </span>
      {children}
    </div>
  );
};
