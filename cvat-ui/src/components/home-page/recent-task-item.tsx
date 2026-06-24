import React from 'react';
import { useHistory } from 'react-router';
import Text from 'antd/lib/typography/Text';
import CVATTooltip from 'components/common/cvat-tooltip';
import dayjs from 'dayjs';
import { STAGE_COLORS } from './stage-colors';
import { StageCounts } from './use-dashboard-data';

interface RecentTaskItemProps {
    task: any;
    stageCounts: StageCounts;
}

export default function RecentTaskItem({ task, stageCounts }: RecentTaskItemProps): JSX.Element {
    const history = useHistory();

    const jobsCount = stageCounts.annotation + stageCounts.validation + stageCounts.acceptance;
    // "jobs done" keeps the strict CVAT definition (acceptance stage AND state=completed),
    // matching the hint shown above the list. The stacked bar below uses pure stage buckets.
    const jobsCompleted = task.progress?.completedJobs ?? 0;

    const pct = (n: number): number => (jobsCount > 0 ? (n / jobsCount) * 100 : 0);

    const segments = [
        { key: 'annotation', label: 'Annotation', value: stageCounts.annotation },
        { key: 'validation', label: 'Validation', value: stageCounts.validation },
        { key: 'acceptance', label: 'Acceptance', value: stageCounts.acceptance },
    ];

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
            <div className='cvat-home-recent-task-item-info'>
                <div className='cvat-home-recent-task-item-main'>
                    <Text strong className='cvat-home-recent-task-item-name'>
                        {task.name || `Task #${task.id}`}
                    </Text>
                    <Text type='secondary' className='cvat-home-recent-task-item-updated'>
                        {dayjs(task.updatedDate).fromNow()}
                    </Text>
                </div>
                <div className='cvat-home-recent-task-item-progress'>
                    {jobsCount > 0 ? segments.map((seg) => (
                        seg.value > 0 && (
                            <CVATTooltip key={seg.key} title={`${seg.label}: ${seg.value}`}>
                                <div
                                    className='cvat-home-recent-task-item-progress-segment'
                                    style={{
                                        width: `${pct(seg.value)}%`,
                                        backgroundColor: STAGE_COLORS[seg.key as keyof typeof STAGE_COLORS],
                                    }}
                                />
                            </CVATTooltip>
                        )
                    )) : null}
                </div>
            </div>
            <Text className='cvat-home-recent-task-item-jobs'>
                {`${jobsCompleted}/${jobsCount} jobs done`}
            </Text>
        </div>
    );
}
