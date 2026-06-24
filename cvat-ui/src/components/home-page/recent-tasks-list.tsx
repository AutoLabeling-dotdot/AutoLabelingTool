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
            <Text type='secondary' className='cvat-home-recent-tasks-hint'>
                A job counts as done when it reaches the acceptance stage and is marked completed
            </Text>
            <div className='cvat-home-recent-tasks-list'>
                {loading ? (
                    <Skeleton active paragraph={{ rows: 4 }} />
                ) : !data || data.recentTasks.length === 0 ? (
                    <Text type='secondary'>No recent tasks</Text>
                ) : (
                    data.recentTasks.map((item) => (
                        <RecentTaskItem
                            key={item.task.id}
                            task={item.task}
                            stageCounts={item.stageCounts}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
