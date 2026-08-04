// Copyright (C) CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

import React from 'react';
import Select from 'antd/lib/select';
import { JobStage, JobState } from 'cvat-core-wrapper';
import { handleDropdownKeyDown } from 'utils/dropdown-utils';
import config from 'config';

interface JobStateSelectorProps {
    value: JobState | null;
    onSelect: (newValue: JobState) => void;
}

export function JobStateSelector({ value, onSelect }: Readonly<JobStateSelectorProps>): JSX.Element {
    return (
        <Select
            className='cvat-job-item-state'
            popupClassName='cvat-job-item-state-dropdown'
            value={value}
            onChange={onSelect}
            onKeyDown={handleDropdownKeyDown}
            placeholder='Select a state'
        >
            <Select.Option value={JobState.NEW}>{JobState.NEW}</Select.Option>
            <Select.Option value={JobState.IN_PROGRESS}>{JobState.IN_PROGRESS}</Select.Option>
            <Select.Option value={JobState.REJECTED}>{JobState.REJECTED}</Select.Option>
            <Select.Option value={JobState.COMPLETED}>{JobState.COMPLETED}</Select.Option>
        </Select>
    );
}

interface JobStageSelectorProps {
    value: JobStage | null;
    onSelect: (newValue: JobStage) => void;
}

export function JobStageSelector({ value, onSelect }: Readonly<JobStageSelectorProps>): JSX.Element {
    return (
        <Select
            className='cvat-job-item-stage'
            popupClassName='cvat-job-item-stage-dropdown'
            value={value}
            onChange={onSelect}
            onKeyDown={handleDropdownKeyDown}
            placeholder='Select a stage'
            listHeight={config.JOB_STAGE_DROPDOWN_LIST_HEIGHT}
        >
            { Object.values(JobStage).map((stage: JobStage) => (
                <Select.Option key={stage} value={stage}>
                    {stage}
                </Select.Option>
            )) }
        </Select>
    );
}
