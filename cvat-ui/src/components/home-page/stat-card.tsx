import React from 'react';
import Card from 'antd/lib/card';
import Skeleton from 'antd/lib/skeleton';
import Text from 'antd/lib/typography/Text';

interface StatCardProps {
    label: string;
    value: number | null;
    loading: boolean;
    onClick: () => void;
}

export default function StatCard({
    label, value, loading, onClick,
}: StatCardProps): JSX.Element {
    return (
        <Card
            hoverable
            className='cvat-home-stat-card'
            onClick={onClick}
        >
            <Text className='cvat-home-stat-card-label'>{label}</Text>
            {loading ? (
                <Skeleton.Input active size='large' className='cvat-home-stat-card-skeleton' />
            ) : (
                <Text className='cvat-home-stat-card-value'>{value ?? '—'}</Text>
            )}
        </Card>
    );
}
