import { useEffect, useState } from 'react';
import { getCore } from 'cvat-core-wrapper';

const core = getCore() as any;
const cvat = {
    projects: core.projects as any,
    tasks: core.tasks as any,
    jobs: core.jobs as any,
};

const jobStageFilter = (stage: string): string => JSON.stringify({
    '==': [{ var: 'stage' }, stage],
});

const projectStageFilter = (projectId: number, stage: string): string => JSON.stringify({
    and: [
        { '==': [{ var: 'project_id' }, projectId] },
        { '==': [{ var: 'stage' }, stage] },
    ],
});

const projectJobsFilter = (projectId: number): string => JSON.stringify({
    '==': [{ var: 'project_id' }, projectId],
});

const projectTaskFilter = (projectId: number): string => JSON.stringify({
    '==': [{ var: 'project_id' }, projectId],
});

export interface ProjectSummary {
    id: number;
    name: string;
    taskCount: number;
    jobCount: number;
    frameCount: number;
    stageCounts: {
        annotation: number;
        validation: number;
        acceptance: number;
    };
}

export interface StageCounts {
    annotation: number;
    validation: number;
    acceptance: number;
}

export interface RecentTask {
    task: any;
    stageCounts: StageCounts;
}

export interface DashboardData {
    counts: {
        projects: number;
        tasks: number;
        jobs: number;
        pendingReviews: number;
    };
    stageCounts: StageCounts;
    recentTasks: RecentTask[];
    projects: ProjectSummary[];
}

const taskJobsFilter = (taskId: number): string => JSON.stringify({
    '==': [{ var: 'task_id' }, taskId],
});

// Maps a job's stage to one of the 3 visualization buckets.
// every numbered validation stage (validation1, validation2, ...) collapses into "validation".
function bucketStage(stage: string): keyof StageCounts {
    if (stage === 'acceptance') return 'acceptance';
    if (stage && stage.startsWith('validation')) return 'validation';
    return 'annotation';
}

interface DashboardState {
    data: DashboardData | null;
    loading: boolean;
    error: Error | null;
}

export function useDashboardData(): DashboardState {
    const [state, setState] = useState<DashboardState>({
        data: null,
        loading: true,
        error: null,
    });

    useEffect(() => {
        let cancelled = false;

        async function fetchAll(): Promise<void> {
            try {
                const [
                    projectsRes,
                    tasksRes,
                    jobsRes,
                    annotationStageRes,
                    acceptanceStageRes,
                    recentTasksRes,
                    projectsListRes,
                ] = await Promise.all([
                    cvat.projects.get({ page: 1, pageSize: 1 }),
                    cvat.tasks.get({ page: 1, pageSize: 1 }),
                    cvat.jobs.get({ page: 1, pageSize: 1 }),
                    cvat.jobs.get({ page: 1, pageSize: 1, filter: jobStageFilter('annotation') }),
                    cvat.jobs.get({ page: 1, pageSize: 1, filter: jobStageFilter('acceptance') }),
                    cvat.tasks.get({ page: 1, pageSize: 5, sort: '-updated_date' }),
                    cvat.projects.get({ page: 1, pageSize: 1000 }),
                ]);

                const totalJobs = jobsRes.count ?? 0;
                const annotationCount = annotationStageRes.count ?? 0;
                const acceptanceCount = acceptanceStageRes.count ?? 0;
                const validationCount = Math.max(0, totalJobs - annotationCount - acceptanceCount);

                if (cancelled) return;

                const projectsList = Array.from(projectsListRes) as any[];

                const projectSummaries: ProjectSummary[] = await Promise.all(
                    projectsList.map(async (project) => {
                        const [
                            tasksForProject,
                            projectJobsRes,
                            annotationCountRes,
                            acceptanceCountRes,
                        ] = await Promise.all([
                            cvat.tasks.get({
                                page: 1,
                                pageSize: 1000,
                                filter: projectTaskFilter(project.id),
                            }),
                            cvat.jobs.get({
                                page: 1,
                                pageSize: 1,
                                filter: projectJobsFilter(project.id),
                            }),
                            cvat.jobs.get({
                                page: 1,
                                pageSize: 1,
                                filter: projectStageFilter(project.id, 'annotation'),
                            }),
                            cvat.jobs.get({
                                page: 1,
                                pageSize: 1,
                                filter: projectStageFilter(project.id, 'acceptance'),
                            }),
                        ]);

                        const tasksArray = Array.from(tasksForProject) as any[];
                        const jobCount = tasksArray.reduce(
                            (sum, t) => sum + (t.progress?.totalJobs ?? 0), 0,
                        );
                        const frameCount = tasksArray.reduce(
                            (sum, t) => sum + (t.size ?? 0), 0,
                        );

                        const projectTotalJobs = projectJobsRes.count ?? 0;
                        const projectAnnotation = annotationCountRes.count ?? 0;
                        const projectAcceptance = acceptanceCountRes.count ?? 0;
                        const projectValidation = Math.max(
                            0, projectTotalJobs - projectAnnotation - projectAcceptance,
                        );

                        return {
                            id: project.id,
                            name: project.name,
                            taskCount: tasksArray.length,
                            jobCount,
                            frameCount,
                            stageCounts: {
                                annotation: projectAnnotation,
                                validation: projectValidation,
                                acceptance: projectAcceptance,
                            },
                        };
                    }),
                );

                const recentTasksArray = Array.from(recentTasksRes) as any[];
                const recentTasks: RecentTask[] = await Promise.all(
                    recentTasksArray.map(async (task) => {
                        const jobsForTask = Array.from(
                            await cvat.jobs.get({
                                page: 1,
                                pageSize: 1000,
                                filter: taskJobsFilter(task.id),
                            }),
                        ) as any[];

                        const stageCounts: StageCounts = {
                            annotation: 0, validation: 0, acceptance: 0,
                        };
                        jobsForTask.forEach((job) => {
                            stageCounts[bucketStage(job.stage)] += 1;
                        });

                        return { task, stageCounts };
                    }),
                );

                if (cancelled) return;

                setState({
                    data: {
                        counts: {
                            projects: projectsRes.count ?? 0,
                            tasks: tasksRes.count ?? 0,
                            jobs: totalJobs,
                            pendingReviews: validationCount,
                        },
                        stageCounts: {
                            annotation: annotationCount,
                            validation: validationCount,
                            acceptance: acceptanceCount,
                        },
                        recentTasks,
                        projects: projectSummaries,
                    },
                    loading: false,
                    error: null,
                });
            } catch (error) {
                // eslint-disable-next-line no-console
                console.error('[Dashboard] fetch failed:', error);
                if (cancelled) return;
                setState({ data: null, loading: false, error: error as Error });
            }
        }

        fetchAll();

        return () => {
            cancelled = true;
        };
    }, []);

    return state;
}
