import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ThreeDotIcon } from '../../images/icons/icons';

interface lineGraphProps {
    data: { name: string, value1: number, value2?: number}[];
    line1Color?: string;
    line2Color?: string;
    xAxisLabel?: string;
    yAxisLabel?: string;
    line1Name?: string;
    line2Name?: string;
    title?: string;
    maxWidth?: number;
    height?: number;
}

const LineGraph: React.FC<lineGraphProps> = ({
    data,
    line1Color = '#1C9D49',
    line2Color = '#9D1C1C',
    xAxisLabel = 'X Axis',
    yAxisLabel = 'Y Axis',
    line1Name = 'Line 1',
    line2Name = 'Line 2',
    title = 'Line Graph',
    maxWidth = 1220,
    height = 200
}) => {
    const [graphData, setGraphData] = useState(data);

    // Use useEffect to listen if data is changed in props
    useEffect(() => {
        setGraphData(data);
    }, [data]);

    const renderTooltip = ({ active, payload, label }: any) => {
        if(active && payload && payload.length) {
            return (
                <div className="custom-tooltip">
                    <p className="tooltip-label1">{`${xAxisLabel}: ${label}`}</p>
                    <p className="tooltip-line1" style={{ color: line1Color }}>{`${payload[0].value} ${yAxisLabel}`}</p>
                    {payload[1] && <p className="tooltip-line2" style={{ color: line2Color }}>{`${payload[1].value} ${yAxisLabel}`}</p>}
                </div>
            )
        }
        return null;
    };

    return (
        <div className="line-graph-container" style={{maxWidth: `${maxWidth}px`}}>
            <div className="line-graph-header">
                <h3 className="line-graph-title">{title}</h3>
                <div className="line-graph-button">
                    <ThreeDotIcon />
                </div>
            </div>
            <ResponsiveContainer className="line-graph" width="100%" height={height}>
                <LineChart data={graphData} margin={{top: 10, right: 20, left: 0, bottom: 10}}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" className="line-graph-grid" />
                    <XAxis dataKey="name" tick={false} axisLine={true} />
                    <YAxis width={20} tick={false} axisLine={true}/>
                    <Tooltip content={renderTooltip} />
                    <defs>
                        {/* Shadow */}
                        <filter id="shadow1" x="-50%" y="-50%" width="200%" height="200%">
                            <feDropShadow dx="2" dy="2" stdDeviation="2" floodColor={line1Color} />
                        </filter>
                        <filter id="shadow2" x="-50%" y="-50%" width="200%" height="200%">
                            <feDropShadow dx="2" dy="2" stdDeviation="2" floodColor={line2Color} />
                        </filter>
                    </defs>
                    <Line type="monotone" dataKey="value1" stroke={line1Color} strokeWidth={2} dot={false} name={line1Name} style={{ filter: 'url(#shadow1)' }} />
                    {graphData[0].value2 !== undefined && (
                            <Line type="monotone" dataKey="value2" stroke={line2Color} strokeWidth={2} dot={false} name={line2Name} style={{ filter: 'url(#shadow2)' }} />
                    )}
                    <Legend verticalAlign="bottom" layout="horizontal" align="center" />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default LineGraph;