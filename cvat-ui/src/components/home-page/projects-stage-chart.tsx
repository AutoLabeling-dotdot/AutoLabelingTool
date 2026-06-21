import React from 'react';
import {
    Chart as ChartJS,
    BarElement,
    CategoryScale,
    LinearScale,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import Skeleton from 'antd/lib/skeleton';
import Text from 'antd/lib/typography/Text';
import { DashboardData } from './use-dashboard-data';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

interface ProjectsStageChartProps {
    data: DashboardData | null;
    loading: boolean;
}

export default function ProjectsStageChart({ data, loading }: ProjectsStageChartProps): JSX.Element {
    const projects = data?.projects ?? [];

    const chartData = {
        labels: projects.map((p) => p.name),
        datasets: [
            {
                label: 'Annotation',
                data: projects.map((p) => p.stageCounts.annotation),
                backgroundColor: '#7452FF',
            },
            {
                label: 'Validation',
                data: projects.map((p) => p.stageCounts.validation),
                backgroundColor: '#C4B5FD',
            },
            {
                label: 'Acceptance',
                data: projects.map((p) => p.stageCounts.acceptance),
                backgroundColor: '#9CA3AF',
            },
        ],
    };

    const options = {
        indexAxis: 'y' as const,
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'bottom' as const },
            tooltip: { mode: 'index' as const, intersect: false },
        },
        scales: {
            x: { stacked: true, beginAtZero: true, ticks: { precision: 0 } },
            y: { stacked: true },
        },
    };

    const hasData = projects.some(
        (p) => p.stageCounts.annotation + p.stageCounts.validation + p.stageCounts.acceptance > 0,
    );

    const chartHeight = Math.max(240, projects.length * 40 + 80);

    return (
        <div className='cvat-home-projects-stage-chart'>
            <Text className='cvat-home-section-title'>Job Stage by Project</Text>
            <div
                className='cvat-home-projects-stage-chart-canvas'
                style={{ height: chartHeight }}
            >
                {loading ? (
                    <Skeleton active paragraph={{ rows: 4 }} />
                ) : !hasData ? (
                    <Text type='secondary'>No jobs yet</Text>
                ) : (
                    <Bar data={chartData} options={options} />
                )}
            </div>
        </div>
    );
}
