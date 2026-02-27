// Copyright (C) 2022 Intel Corporation
// Copyright (C) CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

import React, { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router';
import Card from 'antd/lib/card';
import Descriptions from 'antd/lib/descriptions';
import Progress from 'antd/lib/progress';
import { MoreOutlined } from '@ant-design/icons';

import { Job, JobType } from 'cvat-core-wrapper';
import { useCardHeightHOC, useContextMenuClick } from 'utils/hooks';
import Preview from 'components/common/preview';
import { CombinedState } from 'reducers';
import JobActionsComponent from './actions-menu';

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
    const { itemRef, handleContextMenuClick } = useContextMenuClick<HTMLDivElement>();
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
                    <Descriptions column={1} size='small'>
                        <Descriptions.Item label='Task'>{job.taskName}</Descriptions.Item>
                        <Descriptions.Item label='Stage and state'>{`${job.stage} ${job.state}`}</Descriptions.Item>
                        {/* Frames 항목은 progress bar 섹션으로 대체 - save 이력 있을 때 */}
                        {job.annotationProgress == null && (
                            <Descriptions.Item label='Frames'>{job.stopFrame - job.startFrame + 1}</Descriptions.Item>
                        )}
                        <Descriptions.Item label='Created'>{new Date(job.createdDate).toLocaleDateString()}</Descriptions.Item>
                        {job.assignee ? (
                            <Descriptions.Item label='Assignee'>{job.assignee.username}</Descriptions.Item>
                        ) : (
                            <Descriptions.Item label='Assignee'> </Descriptions.Item>
                        )}
                    </Descriptions>
                    {/* Save 이력이 있을 때만 progress bar 섹션 표시 */}
                    {job.annotationProgress != null && (
                        <div className='cvat-job-card-progress-section'>
                            <div className='cvat-job-card-progress-info'>
                                <span>{`Frame ${job.lastFrame} / ${job.stopFrame - job.startFrame + 1}`}</span>
                                <span>{`${job.annotationProgress}%`}</span>
                            </div>
                            <Progress
                                percent={job.annotationProgress}
                                showInfo={false}
                                strokeColor='#1890ff'
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
