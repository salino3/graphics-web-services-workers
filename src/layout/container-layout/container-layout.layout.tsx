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

  console.log("onLine", navigator.onLine);

  return (
    <div className="rootContainerLayout">
      {isOnline && (
        <span className={`popupOnLine ${visible ? "show" : ""}`}>
          {isOnline}
        </span>
      )}
      {children}
    </div>
  );
};
