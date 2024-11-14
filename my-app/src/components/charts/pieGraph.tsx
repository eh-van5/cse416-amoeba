import React, { useEffect, useState, useRef } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ThreeDotIcon } from '../../images/icons/icons';
import DropdownMenu from '../general/dropdownMenu';
import useChartMenu from './useChartMenu';
import { useTheme } from '../../ThemeContext';

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
    const [isMenuVisible, setMenuVisible] = useState(false);
    const buttonRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<HTMLDivElement>(null);
    const {isDarkMode} = useTheme();

    const menuItems = useChartMenu(chartRef, graphData);

    useEffect(() => {
        setGraphData(data);
    }, [data]);

    const toggleMenu = () => setMenuVisible(!isMenuVisible);
    const closeMenu = () => setMenuVisible(false);

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
        <div className={`square-box-container${isDarkMode ? '-dark' : ''}`}>
            <div className="box-header">
                <h3 className="box-title">{title}</h3>
                <div className="box-header-button"  onClick={toggleMenu} ref={buttonRef} style={{cursor: 'pointer'}}>
                    <ThreeDotIcon />
                </div>
                <DropdownMenu isVisible={isMenuVisible} menuItems={menuItems} buttonRef={buttonRef} onClose={closeMenu} />
            </div>
            <div ref={chartRef} style={{ position: 'relative' }}>
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
        </div>
    );
};

export default PieGraph;