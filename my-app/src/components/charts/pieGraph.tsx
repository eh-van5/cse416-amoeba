import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ThreeDotIcon } from '../../images/icons/icons';

interface pieGraphProps {
    data: {name: string, value: number} [];
    colors?: string[];
    title?: string;
}

const PieGraph: React.FC<pieGraphProps> = ({
    data,
    colors = ['#8884d8', '#82ca9d', '#ffb72b', '#ff8042', '#00C49F'],
    title = 'Pie Chart'
}) => {
    const [graphData, setGraphData] = useState(data);

    useEffect(() => {
        setGraphData(data);
    }, [data]);

    const renderTooltip = ({ active, payload }: any) => {
        if(active && payload && payload.length) {
            const {name, value} = payload[0].payload;
            const index = graphData.findIndex(item => item.name === name);
            const tColor = colors[index % colors.length];
            return (
                <div className="custom-tooltip">
                    <p className="tooltip-line1" style={{color: tColor}}>{`${name}: ${value}`}</p>
                </div>
            )
        }
        return null;
    };

    return (
        <div className="square-box-container">
            <div className="box-header">
                <h3 className="box-title">{title}</h3>
                <div className="box-header-button">
                    <ThreeDotIcon />
                </div>
            </div>
            <PieChart width={300} height={200}>
                <Legend layout="vertical" align="left" verticalAlign="middle" wrapperStyle={{ paddingLeft: '20px' }} />
                <Pie data={graphData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={80} >
                    {graphData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} stroke="0" style={{filter: `drop-shadow(0px 0px 2px ${colors[index % colors.length]}`}} />
                    ))}
                </Pie>
                <Tooltip content={renderTooltip} />
            </PieChart>
        </div>
    );
};

export default PieGraph;