import React from 'react';
import {
    Chart as ChartJS, ArcElement, Tooltip, Legend,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import Skeleton from 'antd/lib/skeleton';
import Text from 'antd/lib/typography/Text';
import { DashboardData } from './use-dashboard-data';

ChartJS.register(ArcElement, Tooltip, Legend);

interface TaskStatusChartProps {
    data: DashboardData | null;
    loading: boolean;
}

export default function TaskStatusChart({ data, loading }: TaskStatusChartProps): JSX.Element {
    const chartData = {
        labels: ['Annotation', 'Validation', 'Acceptance'],
        datasets: [
            {
                data: data ? [
                    data.stageCounts.annotation,
                    data.stageCounts.validation,
                    data.stageCounts.acceptance,
                ] : [0, 0, 0],
                backgroundColor: ['#7452FF', '#C4B5FD', '#9CA3AF'],
                borderWidth: 0,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'bottom' as const },
        },
    };

    const total = data
        ? data.stageCounts.annotation + data.stageCounts.validation + data.stageCounts.acceptance
        : 0;

    return (
        <div className='cvat-home-task-status-chart'>
            <Text className='cvat-home-section-title'>Job Stage Distribution</Text>
            <div className='cvat-home-task-status-chart-canvas'>
                {loading ? (
                    <Skeleton.Avatar active size={180} shape='circle' />
                ) : total === 0 ? (
                    <Text type='secondary'>No jobs yet</Text>
                ) : (
                    <Doughnut data={chartData} options={options} />
                )}
            </div>
        </div>
    );
}
