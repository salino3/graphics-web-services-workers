import type React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowIcon } from "../../icons";
import { routesApp } from "../../router";
import "./btn-return-back.styles.scss";

export const BtnReturnBack: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="rootBtnReturnBack">
      <ArrowIcon
        width={28}
        height={28}
        customStyles={"arrowStyleIcon_01"}
        click={() => navigate(routesApp?.root)}
      />
    </div>
  );
};
