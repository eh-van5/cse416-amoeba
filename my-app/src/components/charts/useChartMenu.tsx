import { useCallback } from "react";
import html2canvas from "html2canvas";
import { saveAs } from "file-saver";

export interface menuItem {
    label: string;
    onClick: () => void;
}

const useChartMenu = (chartRef: React.RefObject<HTMLDivElement>, graphData: any[]): menuItem[] => {
    const exportAsPNG = useCallback(() => {
        if(chartRef.current) {
            html2canvas(chartRef.current).then(canvas => {
                canvas.toBlob(blob => {
                    if(blob) {
                        saveAs(blob, "chart.png");
                    }
                });
            }).catch(error => console.error("PNG Export Error: ", error));
        }
    }, [chartRef]);
    const exportAsSVG = useCallback(() => {
        if(chartRef.current) {
            const svgElement = chartRef.current.querySelector("svg");
            if(svgElement) {
                const serializer = new XMLSerializer();
                const svgData = serializer.serializeToString(svgElement);
                const blob = new Blob([svgData], {type: "image/svg+xml;charset=utf-8"});
                saveAs(blob, "chart.svg");
            }else {
                console.error("SVG Export Error: No SVG element found in chart");
            }
        }
    }, [chartRef]);
    const exportAsCSV = useCallback(() => {
            if(graphData.length > 0) {
                const csvElement = graphData.map((row: any) => Object.values(row).join(",")).join("\n");
                const blob = new Blob([csvElement], { type: "text/csv;charset=utf-8" });
                saveAs(blob, "chart.csv");
            }else {
                console.error("CSV Export Error: No data available");
            }
    }, [graphData]);

    return [
        {label:"Export as PNG", onClick: exportAsPNG},
        {label:"Export as SVG", onClick: exportAsSVG},
        {label:"Export as CSV", onClick: exportAsCSV}
    ];
};

export default useChartMenu;