import {  SparklinesLine } from 'react-sparklines';
import { Sparklines, SparklinesCurve } from 'react-sparklines';

const TrendChart = ({ data }) => {
  return (
    <div className="w-20 h-10 relative">
      <Sparklines data={data} svgWidth={80} svgHeight={30} margin={5}>
        <SparklinesLine
          color="#10B981" // Tailwind emerald-400, adjust as needed
          style={{ strokeWidth: 2.5, fill: "" }}
        />
      </Sparklines>

      {/* Dashed baseline */}
      <div
        className="absolute bottom-2 left-0 right-0 border-t border-dashed border-gray-300"
        style={{ pointerEvents: "none" }}
      />
    </div>
  );
};
export default TrendChart