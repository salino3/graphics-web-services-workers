interface Props {
  width?: number | string;
  height?: number | string;
  fill?: string;
  stroke?: string;
  strokeWidth?: string;
  click?: React.MouseEventHandler<SVGSVGElement> | any;
  customStyles?: string;
}

export const ArrowIcon: React.FC<Props> = (props) => {
  const {
    width = "24",
    height = "24",
    fill = "none",
    stroke = "currentColor",
    strokeWidth = "2",
    click,
    customStyles,
  } = props;

  return (
    <svg
      aria-label="Button go back"
      tabIndex={0}
      className={customStyles}
      onClick={click}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          return click();
        }
      }}
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
};
