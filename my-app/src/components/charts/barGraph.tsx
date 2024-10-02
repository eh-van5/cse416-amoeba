import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ThreeDotIcon } from '../../images/icons/icons';

interface barGraphProps {
    data: {name: string, value1: number, value2?: number}[];
    bar1Color?: string;
    bar2Color?: string;
    xAxisLabel?: string;
    yAxisLabel?: string;
    bar1Name?: string;
    bar2Name?: string;
    title?: string;
}

const BarGraph: React.FC<barGraphProps> = ({
    data,
    bar1Color = '#1C9D49',
    bar2Color = '#9D1C1C',
    xAxisLabel = 'X Axis',
    yAxisLabel = 'Y Axis',
    bar1Name = 'Bar 1',
    bar2Name = 'Bar 2',
    title = 'Bar Graph'
}) => {
    const [graphData, setGraphData] = useState(data);

    useEffect(() => {
        setGraphData(data);
    }, [data]);

    const renderTooltip = ({ active, payload, label }: any) => {
        if(active && payload && payload.length) {
            return (
                <div className="custom-tooltip">
                    <p className="tooltip-label1">{`${xAxisLabel}: ${label}`}</p>
                    <p className="tooltip-line1" style={{ color: bar1Color }}>{`${payload[0].value} ${yAxisLabel}`}</p>
                    {payload[1] && <p className="tooltip-line2" style={{ color: bar2Color }}>{`${payload[1].value} ${yAxisLabel}`}</p>}
                </div>
            )
        }
        return null;
    };

    return (
        <div className="box-container">
            <div className="box-header">
                <h3 className="box-title">{title}</h3>
                <div className="box-header-button">
                    <ThreeDotIcon />
                </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
                <BarChart data={graphData} margin={{top: 10, right: 20, left: 0, bottom: 10}}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" fontSize={12} />
                    <YAxis width={40} fontSize={12} />
                    <Tooltip content={renderTooltip} />
                    <Legend verticalAlign="bottom" layout="horizontal" align="center" />
                    <defs>
                        <filter id="barShadow" x="-50%" y="-50%" width="200%" height="200%">
                            <feDropShadow dx="2" dy="2" stdDeviation="2" floodColor="rgba(0, 0, 0, 3" />
                        </filter>
                    </defs>
                    <Bar dataKey="value1" name={bar1Name} fill={bar1Color} radius={[2, 2, 0, 0]} style={{ filter: `drop-shadow(2px 0 2px ${bar1Color})` }} />
                    {graphData[0].value2 !== undefined && (
                        <Bar dataKey="value2" name={bar2Name} fill={bar2Color} radius={[2, 2, 0, 0]} style={{ filter: `drop-shadow(2px 0 2px ${bar2Color})` }} />
                    )}
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default BarGraph;