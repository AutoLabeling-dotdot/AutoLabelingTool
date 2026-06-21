import React from 'react';
import { Row, Col } from 'antd/lib/grid';
import { useHistory } from 'react-router';
import StatCard from './stat-card';
import { DashboardData } from './use-dashboard-data';

interface StatsCardsProps {
    data: DashboardData | null;
    loading: boolean;
}

export default function StatsCards({ data, loading }: StatsCardsProps): JSX.Element {
    const history = useHistory();

    return (
        <Row gutter={[16, 16]} className='cvat-home-stats-cards'>
            <Col xs={24} sm={12} md={6}>
                <StatCard
                    label='Projects'
                    value={data?.counts.projects ?? null}
                    loading={loading}
                    onClick={() => history.push('/projects')}
                />
            </Col>
            <Col xs={24} sm={12} md={6}>
                <StatCard
                    label='Tasks'
                    value={data?.counts.tasks ?? null}
                    loading={loading}
                    onClick={() => history.push('/tasks')}
                />
            </Col>
            <Col xs={24} sm={12} md={6}>
                <StatCard
                    label='Jobs'
                    value={data?.counts.jobs ?? null}
                    loading={loading}
                    onClick={() => history.push('/jobs')}
                />
            </Col>
            <Col xs={24} sm={12} md={6}>
                <StatCard
                    label='Pending Reviews'
                    value={data?.counts.pendingReviews ?? null}
                    loading={loading}
                    onClick={() => history.push('/jobs')}
                />
            </Col>
        </Row>
    );
}
