import React from 'react';
import { useHistory } from 'react-router';
import Table from 'antd/lib/table';
import Text from 'antd/lib/typography/Text';
import { DashboardData, ProjectSummary } from './use-dashboard-data';

interface ProjectsTableProps {
    data: DashboardData | null;
    loading: boolean;
}

export default function ProjectsTable({ data, loading }: ProjectsTableProps): JSX.Element {
    const history = useHistory();

    const columns = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            render: (name: string, record: ProjectSummary): JSX.Element => (
                <Text
                    className='cvat-home-projects-table-name'
                    onClick={() => history.push(`/projects/${record.id}`)}
                >
                    {name}
                </Text>
            ),
        },
        {
            title: 'Tasks',
            dataIndex: 'taskCount',
            key: 'taskCount',
            width: 120,
        },
        {
            title: 'Jobs',
            dataIndex: 'jobCount',
            key: 'jobCount',
            width: 120,
        },
        {
            title: 'Frames',
            dataIndex: 'frameCount',
            key: 'frameCount',
            width: 140,
            render: (count: number): string => count.toLocaleString(),
        },
    ];

    return (
        <div className='cvat-home-projects-table'>
            <Text className='cvat-home-section-title'>Projects</Text>
            <Table
                rowKey='id'
                columns={columns}
                dataSource={data?.projects ?? []}
                loading={loading}
                pagination={false}
                size='middle'
                locale={{ emptyText: 'No projects' }}
            />
        </div>
    );
}
