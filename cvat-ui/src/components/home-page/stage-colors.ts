// Shared color system for job stage visualizations across the dashboard
// (Job Stage Distribution donut, Recent Tasks bars, Job Stage by Project chart).

export const STAGE_COLORS = {
    annotation: '#C4B5FD', // light purple
    validation: '#7452FF', // purple
    acceptance: '#202735', // near-black
};

// Order matters for stacked visualizations: annotation → validation → acceptance.
export const STAGE_COLOR_LIST = [
    STAGE_COLORS.annotation,
    STAGE_COLORS.validation,
    STAGE_COLORS.acceptance,
];
