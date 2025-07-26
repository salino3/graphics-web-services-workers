import "./bars-graphic.styles.scss";

export const BarsGraphic: React.FC = () => {
  return (
    <div className="rootBarsGraphic">
      <h1 aria-describedby="h1">Bars Graphic 📊</h1>
      <p id="h1" className="sr_only">
        here you can find graphic data (bars graphic)
      </p>
    </div>
  );
};
