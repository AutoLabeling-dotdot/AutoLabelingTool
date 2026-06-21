import React from 'react';
import { useHistory } from 'react-router';
import Tag from 'antd/lib/tag';
import Progress from 'antd/lib/progress';
import Text from 'antd/lib/typography/Text';
import dayjs from 'dayjs';

const STATUS_COLORS: Record<string, string> = {
    annotation: 'blue',
    validation: 'orange',
    completed: 'green',
};

interface RecentTaskItemProps {
    task: any;
}

export default function RecentTaskItem({ task }: RecentTaskItemProps): JSX.Element {
    const history = useHistory();

    const jobsCount = task.jobs?.count ?? 0;
    const jobsCompleted = task.jobs?.completed ?? 0;
    const progress = jobsCount > 0 ? Math.round((jobsCompleted / jobsCount) * 100) : 0;

    return (
        <div
            className='cvat-home-recent-task-item'
            onClick={() => history.push(`/tasks/${task.id}`)}
            role='button'
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter') history.push(`/tasks/${task.id}`);
            }}
        >
            <div className='cvat-home-recent-task-item-main'>
                <Text strong className='cvat-home-recent-task-item-name'>
                    {task.name || `Task #${task.id}`}
                </Text>
                <Tag color={STATUS_COLORS[task.status] || 'default'}>{task.status}</Tag>
            </div>
            <div className='cvat-home-recent-task-item-meta'>
                <Progress
                    percent={progress}
                    size='small'
                    showInfo={false}
                    className='cvat-home-recent-task-item-progress'
                />
                <Text type='secondary' className='cvat-home-recent-task-item-updated'>
                    {dayjs(task.updatedDate).fromNow()}
                </Text>
            </div>
        </div>
    );
}
