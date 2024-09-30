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
        <div className="line-graph-container">
            <div className="line-graph-header">
                <h3 className="line-graph-title">{title}</h3>
                <div className="line-graph-button">
                    <ThreeDotIcon />
                </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
                <BarChart data={graphData} margin={{top: 10, right: 20, left: 0, bottom: 10}}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis width={40} />
                    <Tooltip content={renderTooltip} />
                    <Legend verticalAlign="bottom" layout="horizontal" align="center" />
                    <Bar dataKey="value1" name={bar1Name} fill={bar1Color} radius={[5, 5, 0, 0]} />
                    {graphData[0].value2 !== undefined && (
                        <Bar dataKey="value2" name={bar2Name} fill={bar2Color} radius={[5, 5, 0, 0]} />
                    )}
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

export default BarGraph;