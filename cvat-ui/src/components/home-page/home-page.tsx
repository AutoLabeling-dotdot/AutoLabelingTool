import './styles.scss';
import React from 'react';
import { Row, Col } from 'antd/lib/grid';
import dimensions from 'utils/dimensions';
import { useDashboardData } from './use-dashboard-data';
import StatsCards from './stats-cards';
import TaskStatusChart from './task-status-chart';
import RecentTasksList from './recent-tasks-list';
import ProjectsTable from './projects-table';
import ProjectsStageChart from './projects-stage-chart';

export default function HomePageComponent(): JSX.Element {
    const { data, loading } = useDashboardData();

    return (
        <div className='cvat-home-page'>
            <Row justify='center' align='top'>
                <Col {...dimensions}>
                    <StatsCards data={data} loading={loading} />
                    <Row gutter={[16, 16]} className='cvat-home-content-row'>
                        <Col xs={24}>
                            <ProjectsTable data={data} loading={loading} />
                        </Col>
                    </Row>
                    <Row gutter={[16, 16]} className='cvat-home-content-row'>
                        <Col xs={24} md={10}>
                            <TaskStatusChart data={data} loading={loading} />
                        </Col>
                        <Col xs={24} md={14}>
                            <RecentTasksList data={data} loading={loading} />
                        </Col>
                    </Row>
                    <Row gutter={[16, 16]} className='cvat-home-content-row'>
                        <Col xs={24}>
                            <ProjectsStageChart data={data} loading={loading} />
                        </Col>
                    </Row>
                </Col>
            </Row>
        </div>
    );
}
