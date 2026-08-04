// Copyright (C) CVAT.ai Corporation
//
// SPDX-License-Identifier: MIT

import { Config } from '@react-awesome-query-builder/antd';
import { JobStage } from 'cvat-core-wrapper';
import asyncFetchUsers from 'components/resource-sorting-filtering/request-users';
import appConfig from 'config';

const STAGE_LIST_HEIGHT = appConfig.JOB_STAGE_DROPDOWN_LIST_HEIGHT;

export const config: Partial<Config> = {
    fields: {
        state: {
            label: 'State',
            type: 'select',
            operators: ['select_any_in', 'select_equals'], // ['select_equals', 'select_not_equals', 'select_any_in', 'select_not_any_in']
            valueSources: ['value'],
            fieldSettings: {
                listValues: [
                    { value: 'new', title: 'new' },
                    { value: 'in progress', title: 'in progress' },
                    { value: 'rejected', title: 'rejected' },
                    { value: 'completed', title: 'completed' },
                ],
            },
        },
        stage: {
            label: 'Stage',
            type: 'select',
            operators: ['select_any_in', 'select_equals'],
            valueSources: ['value'],
            fieldSettings: {
                listValues: Object.values(JobStage).map((stage) => ({ value: stage, title: stage })),
            },
            // 'select_equals' renders the select widget, 'select_any_in' the multiselect one;
            // customProps is spread onto the underlying antd Select by both
            widgets: {
                select: { widgetProps: { customProps: { listHeight: STAGE_LIST_HEIGHT } } },
                multiselect: { widgetProps: { customProps: { listHeight: STAGE_LIST_HEIGHT } } },
            },
        },
        dimension: {
            label: 'Dimension',
            type: 'select',
            operators: ['select_equals'],
            valueSources: ['value'],
            fieldSettings: {
                listValues: [
                    { value: '2d', title: '2D' },
                    { value: '3d', title: '3D' },
                ],
            },
        },
        assignee: {
            label: 'Assignee',
            type: 'select',
            valueSources: ['value'],
            operators: ['select_equals'],
            fieldSettings: {
                useAsyncSearch: true,
                forceAsyncSearch: true,
                asyncFetch: asyncFetchUsers,
            },
        },
        updatedDate: {
            label: 'Last updated',
            type: 'datetime',
            operators: ['between', 'greater', 'greater_or_equal', 'less', 'less_or_equal'],
        },
        type: {
            label: 'Type',
            type: 'select',
            operators: ['select_equals'],
            valueSources: ['value'],
            fieldSettings: {
                listValues: [
                    { value: 'annotation', title: 'Annotation' },
                    { value: 'ground_truth', title: 'Ground truth' },
                ],
            },
        },
        id: {
            label: 'ID',
            type: 'number',
            operators: ['equal', 'between', 'greater', 'greater_or_equal', 'less', 'less_or_equal'],
            fieldSettings: { min: 0 },
            valueSources: ['value'],
        },
    },
};

export const localStorageRecentCapacity = 10;
export const localStorageRecentKeyword = 'recentlyAppliedJobsFilters';
export const predefinedFilterValues = {
    'Assigned to me': '{"and":[{"==":[{"var":"assignee"},"<username>"]}]}',
    'Not completed': '{"!":{"or":[{"==":[{"var":"state"},"completed"]},{"==":[{"var":"stage"},"acceptance"]}]}}',
};
