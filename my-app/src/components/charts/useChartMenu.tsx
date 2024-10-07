import { useCallback } from "react";


export interface menuItem {
    label: string;
    onClick: () => void;
}

const useChartMenu = (): menuItem[] => {
    const exportAsPNG = useCallback(() => {
        console.log("Exporting as PNG");
    }, []);
    const exportAsSVG = useCallback(() => {
        console.log("Exporting as SVG");
    }, []);
    const exportAsCSV = useCallback(() => {
        console.log("Exporting as CSV");
    }, []);

    return [
        {label:"Export as PNG", onClick: exportAsPNG},
        {label:"Export as SVG", onClick: exportAsSVG},
        {label:"Export as CSV", onClick: exportAsCSV}
    ];
};

export default useChartMenu;