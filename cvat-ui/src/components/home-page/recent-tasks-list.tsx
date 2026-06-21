import React from 'react';
import Skeleton from 'antd/lib/skeleton';
import Text from 'antd/lib/typography/Text';
import RecentTaskItem from './recent-task-item';
import { DashboardData } from './use-dashboard-data';

interface RecentTasksListProps {
    data: DashboardData | null;
    loading: boolean;
}

export default function RecentTasksList({ data, loading }: RecentTasksListProps): JSX.Element {
    return (
        <div className='cvat-home-recent-tasks'>
            <Text className='cvat-home-section-title'>Recent Tasks</Text>
            <div className='cvat-home-recent-tasks-list'>
                {loading ? (
                    <Skeleton active paragraph={{ rows: 4 }} />
                ) : !data || data.recentTasks.length === 0 ? (
                    <Text type='secondary'>No recent tasks</Text>
                ) : (
                    data.recentTasks.map((task: any) => (
                        <RecentTaskItem key={task.id} task={task} />
                    ))
                )}
            </div>
        </div>
    );
}
