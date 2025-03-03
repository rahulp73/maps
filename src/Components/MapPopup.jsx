import { Tooltip } from "@mui/material";

export default MapPopup = ({ stateName, metricLabel, metricValue }) => (
    <Tooltip
      title={
        <div>
          <h3>{stateName}</h3>
          <p>
            {metricLabel}: {metricValue.toLocaleString()}
          </p>
        </div>
      }
      arrow
      open
      placement="top"
    >
      <div style={{ width: 0, height: 0 }} />
    </Tooltip>
  );