// Copyright (C) 2022 Intel Corporation
// Copyright (C) CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

import React, { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router';
import dayjs from 'dayjs';
import Card from 'antd/lib/card';
import Tag from 'antd/lib/tag';
import Text from 'antd/lib/typography/Text';
import Progress from 'antd/lib/progress';
import { MoreOutlined } from '@ant-design/icons';

import { Job, JobType } from 'cvat-core-wrapper';
import { useCardHeightHOC, useContextMenuClick } from 'utils/hooks';
import Preview from 'components/common/preview';
import { CombinedState } from 'reducers';
import JobActionsComponent from './actions-menu';

const STATE_CLASS: Record<string, string> = {
    new: 'cvat-job-card-state-new',
    'in progress': 'cvat-job-card-state-progress',
    completed: 'cvat-job-card-state-completed',
    rejected: 'cvat-job-card-state-rejected',
};

const useCardHeight = useCardHeightHOC({
    containerClassName: 'cvat-jobs-page',
    siblingClassNames: ['cvat-jobs-page-pagination', 'cvat-jobs-page-top-bar'],
    paddings: 80,
    minHeight: 200,
    numberOfRows: 2,
});

interface Props {
    job: Job;
    selected: boolean;
    onClick: (event: React.MouseEvent) => boolean;
}

function JobCardComponent(props: Readonly<Props>): JSX.Element {
    const { job, selected, onClick } = props;

    const deletes = useSelector((state: CombinedState) => state.jobs.activities.deletes);
    const deleted = job.id in deletes ? deletes[job.id] === true : false;

    const history = useHistory();
    const height = useCardHeight();
    const { itemRef, handleContextMenuClick, handleContextMenuCapture } = useContextMenuClick<HTMLDivElement>();
    const handleCardClick = useCallback((event: React.MouseEvent): void => {
        const cancel = onClick(event);
        if (!cancel) {
            const url = `/tasks/${job.taskId}/jobs/${job.id}`;
            if (event.ctrlKey) {
                window.open(url, '_blank', 'noopener noreferrer');
            } else {
                history.push(url);
            }
        }
    }, [job, onClick]);

    const style = {};
    if (deleted) {
        (style as any).pointerEvents = 'none';
        (style as any).opacity = 0.5;
    }

    let tag = null;
    if (job.type === JobType.GROUND_TRUTH) {
        tag = 'Ground truth';
    } else if (job.type === JobType.ANNOTATION && job.consensusReplicas > 0) {
        tag = 'Consensus';
    }

    const cardClassName = `cvat-job-page-list-item${selected ? ' cvat-item-selected' : ''}`;

    /* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */
    return (
        <JobActionsComponent
            jobInstance={job}
            consensusJobsPresent={false}
            dropdownTrigger={['contextMenu']}
            triggerElement={(
                <Card
                    ref={itemRef}
                    style={{ ...style, height }}
                    className={cardClassName}
                    cover={(
                        <>
                            <Preview
                                job={job}
                                onClick={handleCardClick}
                                loadingClassName='cvat-job-item-loading-preview'
                                emptyPreviewClassName='cvat-job-item-empty-preview'
                                previewWrapperClassName='cvat-jobs-page-job-item-card-preview-wrapper'
                                previewClassName='cvat-jobs-page-job-item-card-preview'
                            />
                            <div className='cvat-job-page-list-item-id'>
                                ID:
                                {` ${job.id}`}
                            </div>
                            {tag && <div className='cvat-job-page-list-item-type'>{tag}</div>}
                            <div className='cvat-job-page-list-item-dimension'>{job.dimension.toUpperCase()}</div>
                        </>
                    )}
                    hoverable
                    onClick={onClick}
                >
                    <div className='cvat-job-card-info'>
                        <div className='cvat-job-card-stage-row'>
                            <Text className='cvat-job-card-stage'>{job.stage}</Text>
                            <Tag className={`cvat-job-card-state ${STATE_CLASS[job.state] || ''}`}>
                                {job.state}
                            </Tag>
                        </div>
                        <Text className='cvat-job-card-task-name' ellipsis={{ tooltip: job.taskName }}>
                            {job.taskName}
                        </Text>
                        <div className='cvat-job-card-meta-row'>
                            <Text className='cvat-job-card-frames'>
                                {`${job.stopFrame - job.startFrame + 1} frames`}
                            </Text>
                            {job.assignee && (
                                <Text className='cvat-job-card-assignee'>{job.assignee.username}</Text>
                            )}
                        </div>
                        <Text className='cvat-job-card-created'>
                            {`${dayjs(job.createdDate).format('YYYY.MM.DD')} created`}
                        </Text>
                    </div>
                    {/* Save 이력이 있을 때만 progress bar 섹션 표시 */}
                    {job.annotationProgress != null && job.lastFrame != null && (
                        <div className='cvat-job-card-progress-section'>
                            <div className='cvat-job-card-progress-info'>
                                <span>{`Frame ${job.lastFrame - job.startFrame + 1} / ${job.stopFrame - job.startFrame + 1}`}</span>
                                <span>{`${job.annotationProgress}%`}</span>
                            </div>
                            <Progress
                                percent={job.annotationProgress}
                                showInfo={false}
                                strokeColor='#ffffff'
                                size='small'
                            />
                        </div>
                    )}
                    <div
                        onClick={handleContextMenuClick}
                        className='cvat-job-card-more-button cvat-actions-menu-button'
                    >
                        <MoreOutlined className='cvat-menu-icon' />
                    </div>
                </Card>
            )}
        />
    );
}

export default React.memo(JobCardComponent);
