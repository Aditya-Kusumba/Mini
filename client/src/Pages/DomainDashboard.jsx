import React, { useState, useCallback, useMemo } from 'react';

// Charting and Icon Imports
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';
import { ChevronRight, Gauge, Clock, Edit3, TrendingUp, Cpu, Database, Code, Zap, Sun, Moon } from 'lucide-react';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

// --- Constant Data (Previously from Firebase) ---
const INITIAL_DATA = {
    overallMetrics: { totalTests: 35 },
    domains: {
        'frontend-dev': {
            name: 'Frontend Development',
            icon: 'Code',
            testsWritten: 12,
            avgScore: 85,
            highScore: 92,
            timeSpentHours: 45,
            masteryBreakdown: { HTML_CSS: 45, JavaScript: 35, React: 20 },
            scoreHistory: [65, 70, 75, 88, 92], // Last 5 scores
            activityHeatmap: [1, 2, 0, 3, 4, 1, 0, 2, 3, 4, 1, 2, 0, 3, 1, 2, 4, 3, 1, 0, 2, 3, 4, 1, 2, 0, 3, 1, 2, 4, 3, 1, 0, 2, 3, 4, 1, 2, 0, 3, 1, 2, 4, 3, 1, 0, 2, 3, 4, 1, 2, 3], // 52 weeks
            previousTests: [
                { question: 'Explain the difference between event bubbling and capturing.', topic: 'JavaScript', result: 'Correct' },
                { question: 'How would you conditionally render components in React?', topic: 'React', result: 'Correct' },
                { question: 'What is the purpose of the `z-index` property?', topic: 'HTML_CSS', result: 'Incorrect' },
                { question: 'Describe the useEffect hook and its dependency array.', topic: 'React', result: 'Correct' },
                { question: 'Write a media query to target mobile devices.', topic: 'HTML_CSS', result: 'Correct' },
            ],
        },
        'data-science': {
            name: 'Data Science & ML',
            icon: 'Cpu',
            testsWritten: 8,
            avgScore: 78,
            highScore: 85,
            timeSpentHours: 30,
            masteryBreakdown: { Python: 50, Statistics: 30, ML: 20 },
            scoreHistory: [55, 60, 70, 80, 85],
            activityHeatmap: [0, 1, 1, 2, 3, 0, 1, 2, 2, 1, 0, 3, 4, 1, 2, 0, 3, 1, 2, 4, 3, 1, 0, 2, 3, 4, 1, 2, 0, 3, 1, 2, 4, 3, 1, 0, 2, 3, 4, 1, 2, 0, 3, 1, 2, 4, 3, 1, 0, 2, 3, 4],
            previousTests: [
                { question: 'What is the formula for calculating the F1 score?', topic: 'ML', result: 'Correct' },
                { question: 'Load a CSV file into a Pandas DataFrame and calculate the mean of column X.', topic: 'Python', result: 'Correct' },
                { question: 'Define p-value and its significance in hypothesis testing.', topic: 'Statistics', result: 'Incorrect' },
                { question: 'Explain the concept of overfitting in a decision tree model.', topic: 'ML', result: 'Correct' },
                { question: 'How does NumPy array slicing differ from Python list slicing?', topic: 'Python', result: 'Correct' },
            ],
        },
        'backend-api': {
            name: 'Backend & API Design',
            icon: 'Database',
            testsWritten: 15,
            avgScore: 90,
            highScore: 98,
            timeSpentHours: 60,
            masteryBreakdown: { NodeJS: 40, Databases: 30, Security: 30 },
            scoreHistory: [80, 85, 90, 95, 98],
            activityHeatmap: [4, 4, 3, 3, 2, 2, 1, 1, 0, 0, 4, 3, 2, 1, 4, 3, 2, 1, 4, 3, 2, 1, 4, 3, 2, 1, 4, 3, 2, 1, 4, 3],
            previousTests: [
                { question: 'Implement a secure user authentication endpoint using JWTs.', topic: 'Security', result: 'Correct' },
                { question: 'Write a basic Express server that handles GET and POST requests.', topic: 'NodeJS', result: 'Correct' },
                { question: 'Explain the difference between SQL JOINs (INNER, LEFT, RIGHT).', topic: 'Databases', result: 'Correct' },
                { question: 'What is Cross-Site Request Forgery (CSRF) and how do you prevent it?', topic: 'Security', result: 'Correct' },
                { question: 'Design a NoSQL schema for a blog application comments section.', topic: 'Databases', result: 'Incorrect' },
            ],
        }
    }
};

// Component Map for Lucide Icons
const IconMap = {
    Code: Code,
    Cpu: Cpu,
    Database: Database,
    Gauge: Gauge,
    Clock: Clock,
    Edit3: Edit3,
    TrendingUp: TrendingUp,
    Zap: Zap,
    Sun: Sun,
    Moon: Moon,
};

// --- Theme and Utility Functions ---
const ACCENT_COLOR_LIGHT = 'rgb(14, 165, 233)';
const ACCENT_COLOR_DARK = 'rgb(56, 189, 248)';
const SUCCESS_COLOR = 'rgb(16, 185, 129)';
const WARNING_COLOR = 'rgb(245, 158, 11)';
const DANGER_COLOR = 'rgb(239, 68, 68)';

// --- Sub Components ---

const StatCard = ({ icon: Icon, value, label, color = 'var(--accent-color)' }) => (
    <div className="stat-card">
        <div className="stat-header" style={{ color: color }}>
            <Icon className="icon-large" />
            <span className="stat-label">{label}</span>
        </div>
        <div className="stat-value" style={{ color: color }}>{value}</div>
    </div>
);

const ActivityHeatmap = ({ activityData }) => {
    const totalWeeks = 52;
    const weeksToDisplay = activityData.length;

    const days = Array.from({ length: totalWeeks * 7 }, (_, i) => {
        const weekIndex = Math.floor(i / 7);
        const level = weekIndex < weeksToDisplay ? activityData[weekIndex] : 0;

        let colorClass = 'heat-level-0';
        if (level === 1) colorClass = 'heat-level-1';
        else if (level === 2) colorClass = 'heat-level-2';
        else if (level === 3) colorClass = 'heat-level-3';
        else if (level >= 4) colorClass = 'heat-level-4';

        return <div key={i} className={`heatmap-day ${colorClass}`} title={`Activity Level: ${level}`} />;
    });

    const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    return (
        <div className="card heatmap-container">
            <h2 className="section-title">Activity Heatmap (Submissions Last Year)</h2>
            <div className="heatmap-grid-wrapper">
                <div className="heatmap-day-labels">
                    <span>M</span><span className="opacity-zero">T</span><span>W</span><span className="opacity-zero">T</span><span>F</span><span className="opacity-zero">S</span><span>S</span>
                </div>
                <div className="heatmap-grid">{days}</div>
            </div>
            <div className="heatmap-month-labels">
                {monthLabels.map(month => <span key={month}>{month}</span>)}
            </div>
        </div>
    );
};

// --- Chart Components ---

const ScoreTrendChart = React.memo(({ scoreHistory }) => {
    const getChartThemeColor = () => getComputedStyle(document.documentElement).getPropertyValue('--text-dark').trim();

    const data = useMemo(() => ({
        labels: scoreHistory.map((_, i) => `Test ${i + 1}`),
        datasets: [{
            label: 'Test Score (%)',
            data: scoreHistory,
            borderColor: 'var(--accent-color)',
            backgroundColor: 'rgba(14, 165, 233, 0.1)',
            borderWidth: 3,
            tension: 0.3,
            pointRadius: 6,
            pointBackgroundColor: 'var(--accent-color)',
            fill: true,
        }],
    }), [scoreHistory]);

    const options = useMemo(() => ({
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: true,
                max: 100,
                title: { display: true, text: 'Score (%)', color: getChartThemeColor() },
                grid: { color: 'var(--border-mid)' },
                ticks: { color: getChartThemeColor() }
            },
            x: {
                grid: { color: 'var(--border-mid)' },
                ticks: { color: getChartThemeColor() }
            }
        },
        plugins: {
            legend: { display: false },
            tooltip: { mode: 'index', intersect: false }
        }
    }), []);

    return (
        <div className="chart-content">
            <h2 className="section-title chart-title">Score Trend Over Last {scoreHistory.length} Tests</h2>
            <div className="chart-area">
                <Line data={data} options={options} />
            </div>
        </div>
    );
});

const MasteryPieChart = React.memo(({ masteryBreakdown }) => {
    const getChartThemeColor = () => getComputedStyle(document.documentElement).getPropertyValue('--text-dark').trim();

    const data = useMemo(() => ({
        labels: Object.keys(masteryBreakdown),
        datasets: [{
            data: Object.values(masteryBreakdown),
            backgroundColor: ['var(--accent-color)', SUCCESS_COLOR, WARNING_COLOR, 'rgb(236, 72, 153)'],
            hoverOffset: 8,
            borderWidth: 0,
        }],
    }), [masteryBreakdown]);

    const options = useMemo(() => ({
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
            legend: {
                position: 'right',
                labels: { color: getChartThemeColor(), boxWidth: 15, padding: 20 },
            },
            tooltip: { callbacks: { label: ({ label, parsed }) => `${label}: ${parsed}%` } }
        }
    }), []);

    return (
        <div className="chart-content">
            <h2 className="section-title chart-title">Topic Mastery Breakdown</h2>
            <div className="chart-area center-flex">
                <Doughnut data={data} options={options} />
            </div>
        </div>
    );
});

// --- Attempted Questions Component ---

const AttemptedQuestionsList = ({ previousTests }) => {
    if (!previousTests || previousTests.length === 0) {
        return (
            <div className="card question-list-container">
                <h2 className="section-title">Previous Attempted Questions</h2>
                <div className="center-flex" style={{ height: '100px', color: 'var(--text-mid)' }}>
                    No question history found for this domain.
                </div>
            </div>
        );
    }

    return (
        <div className="card question-list-container">
            <h2 className="section-title">Previous Attempted Questions ({previousTests.length} Samples)</h2>
            <div className="details-table-wrapper">
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    <table className="details-table">
                        <thead className="details-table-header">
                            <tr style={{ position: 'sticky', top: 0, backgroundColor: 'var(--table-header-bg)', zIndex: 10 }}>
                                <th className="table-header-cell" style={{ width: '60%' }}>Question</th>
                                <th className="table-header-cell" style={{ width: '25%' }}>Topic</th>
                                <th className="table-header-cell" style={{ width: '15%' }}>Result</th>
                            </tr>
                        </thead>
                        <tbody className="details-table-body">
                            {previousTests.map((item, index) => (
                                <tr key={index} className="table-row">
                                    <td className="table-data-question">{item.question}</td>
                                    <td className="table-data-topic">{item.topic}</td>
                                    <td className="table-data-result">
                                        <span className={`result-badge ${item.result === 'Correct' ? 'correct' : 'incorrect'}`}>
                                            {item.result}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};


// --- Main Application Component ---

export default function DomainDashboard() {
    const [performanceData] = useState(INITIAL_DATA);
    const [currentDomainKey, setCurrentDomainKey] = useState('data-science');
    const [isDarkMode, setIsDarkMode] = useState(false);

    const toggleTheme = useCallback(() => {
        setIsDarkMode(prev => !prev);
    }, []);

    // Derived State
    const currentDomainData = performanceData.domains[currentDomainKey];
    const overallTests = performanceData.overallMetrics?.totalTests || 0;
    const domainKeys = Object.keys(performanceData.domains);

    const handleDomainSelection = useCallback((key) => {
        setCurrentDomainKey(key);
    }, []);

    const themeClass = isDarkMode ? 'dark-mode' : 'light-mode';

    return (
        <div className={`app-container ${themeClass}`}>
            <style jsx>{`
                /* --- BASE COLOR VARIABLES (Light Mode Default) --- */
                :root {
                    --accent-color: ${ACCENT_COLOR_LIGHT};
                    --success-color: ${SUCCESS_COLOR};
                    --warning-color: ${WARNING_COLOR};
                    --danger-color: ${DANGER_COLOR};
                    
                    /* Light Theme */
                    --text-dark: rgb(17, 24, 39);
                    --text-mid: rgb(75, 85, 99);
                    --bg-primary: rgb(245, 245, 245);
                    --card-bg: white;
                    --border-light: rgb(229, 231, 235);
                    --border-mid: rgba(200, 200, 200, 0.5);
                    --table-header-bg: rgb(249, 250, 251);
                }

                /* --- DARK MODE OVERRIDES --- */
                .dark-mode {
                    --accent-color: ${ACCENT_COLOR_DARK};
                    --text-dark: rgb(243, 244, 246);
                    --text-mid: rgb(156, 163, 175);
                    --bg-primary: rgb(17, 24, 39);
                    --card-bg: rgb(31, 41, 55);
                    --border-light: rgb(55, 65, 81);
                    --border-mid: rgba(100, 100, 100, 0.5);
                    --table-header-bg: rgb(31, 41, 55);
                }

                /* --- General Styles --- */
                .app-container {
                    min-height: 100vh;
                    padding: 1rem;
                    font-family: 'Inter', sans-serif;
                    background-color: var(--bg-primary);
                    color: var(--text-dark);
                    transition: background-color 300ms, color 300ms;
                }
                @media (min-width: 768px) { .app-container { padding: 2rem; } }
                .icon-large { width: 1.5rem; height: 1.5rem; }
                .icon-medium { width: 1.25rem; height: 1.25rem; }
                .opacity-zero { opacity: 0; }
                .center-flex { display: flex; align-items: center; justify-content: center; padding: 1rem; }

                /* Header */
                .app-header { margin-bottom: 2rem; border-bottom: 1px solid var(--border-light); padding-bottom: 1rem; display: flex; justify-content: space-between; align-items: center; }
                .header-left { display: flex; flex-direction: column; }
                .app-title { font-size: 1.875rem; font-weight: 700; color: var(--accent-color); }
                .user-info { color: var(--text-mid); margin-top: 0.25rem; display: flex; align-items: center; font-size: 0.875rem; }
                .user-info span:first-child { font-weight: 600; margin-right: 0.5rem; }
                #user-id-display { font-size: 0.875rem; color: var(--text-mid); opacity: 0.8; }
                .user-edit-icon { width: 1rem; height: 1rem; margin-left: 0.75rem; color: var(--success-color); cursor: pointer; }

                /* Theme Toggle Button */
                .theme-toggle-button { background: none; border: 2px solid var(--border-light); border-radius: 9999px; padding: 0.5rem; cursor: pointer; display: flex; align-items: center; transition: background-color 300ms, border-color 300ms; color: var(--text-dark); }
                .theme-toggle-button:hover { background-color: var(--border-light); }
                .theme-toggle-icon { width: 1.5rem; height: 1.5rem; color: var(--accent-color); }

                /* Layout */
                .main-layout { display: flex; flex-direction: column; gap: 1.5rem; }
                .sidebar-container { width: 100%; flex-shrink: 0; }
                .main-content { flex-grow: 1; }
                @media (min-width: 1024px) {
                    .main-layout { flex-direction: row; }
                    .sidebar-container { width: 18rem; }
                }

                /* Card */
                .card { background-color: var(--card-bg); padding: 1.25rem; border-radius: 0.75rem; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); border: 1px solid var(--border-light); transition: background-color 300ms, border-color 300ms, box-shadow 300ms; }
                .dark-mode .card { box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.2), 0 4px 6px -2px rgba(0, 0, 0, 0.1); }
                .section-title { font-size: 1.25rem; font-weight: 600; color: var(--accent-color); margin-bottom: 1rem; border-bottom: 1px solid var(--border-light); padding-bottom: 0.75rem; transition: border-color 300ms; }
                .stat-card { background-color: var(--card-bg); padding: 1rem; border-radius: 0.75rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.06); border: 1px solid var(--border-light); display: flex; flex-direction: column; align-items: flex-start; gap: 0.5rem; transition: background-color 300ms, border-color 300ms; }
                .stat-header { display: flex; align-items: center; gap: 0.5rem; }
                .stat-label { font-size: 0.875rem; font-weight: 600; color: var(--text-mid); text-transform: uppercase; letter-spacing: 0.05em; }
                .stat-value { font-size: 2.25rem; font-weight: 700; }

                /* Domain Selector */
                .domain-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.5rem; }
                .domain-item { display: flex; align-items: center; justify-content: space-between; padding: 0.75rem; border-radius: 0.5rem; transition: all 200ms ease-in-out; cursor: pointer; color: var(--text-dark); }
                .domain-item:hover { background-color: var(--border-light); }
                .domain-item-active { background-color: rgba(56, 189, 248, 0.1); border-left: 4px solid var(--accent-color); font-weight: 600; padding-left: calc(0.75rem - 4px); }
                .domain-item-content { display: flex; align-items: center; gap: 0.75rem; }
                .domain-icon-inactive { color: var(--text-mid); }
                .domain-icon-active { color: var(--accent-color); }
                .score-badge { font-size: 0.75rem; font-weight: 700; background-color: rgba(56, 189, 248, 0.1); color: var(--accent-color); padding: 0.25rem 0.75rem; border-radius: 9999px; }

                /* Analysis */
                .analysis-header { font-size: 1.875rem; font-weight: 700; color: var(--text-dark); margin-bottom: 1.5rem; display: flex; align-items: center; transition: color 300ms; }
                .analysis-header-icon { width: 1.5rem; height: 1.5rem; margin-right: 0.25rem; color: var(--accent-color); }
                .metric-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem; margin-bottom: 2rem; }
                @media (min-width: 768px) { .metric-grid { grid-template-columns: repeat(4, 1fr); } }
                
                /* Charts */
                .chart-row { display: grid; grid-template-columns: 1fr; gap: 1.5rem; margin-bottom: 2rem; }
                @media (min-width: 1024px) { .chart-row { grid-template-columns: repeat(2, 1fr); } }
                .chart-container { background-color: var(--card-bg); padding: 1.5rem; border-radius: 0.75rem; border: 1px solid var(--border-light); box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); height: 24rem; transition: background-color 300ms, border-color 300ms; }
                .chart-content { height: 100%; min-height: 300px; display: flex; flex-direction: column; }
                .chart-title { margin-bottom: 1rem; padding-bottom: 0.75rem; }
                .chart-area { flex-grow: 1; min-height: 250px; overflow: hidden; }

                /* Heatmap */
                .heatmap-container { padding: 1.5rem; }
                .heatmap-grid-wrapper { display: flex; gap: 0.75rem; overflow-x: auto; padding-bottom: 0.5rem; }
                .heatmap-day-labels { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.75rem; color: var(--text-mid); font-weight: 500; padding-top: 0.75rem; margin-right: 0.25rem; }
                .heatmap-grid { display: flex; flex-direction: column; flex-wrap: wrap; height: 7.5rem; gap: 0.25rem; }
                .heatmap-day { width: 0.75rem; height: 0.75rem; border-radius: 0.125rem; transition: background-color 300ms; }
                .heat-level-0 { background-color: var(--border-light); }
                .heat-level-1 { background-color: rgb(209, 250, 229); }
                .heat-level-2 { background-color: rgb(110, 231, 183); }
                .heat-level-3 { background-color: rgb(5, 150, 105); }
                .heat-level-4 { background-color: rgb(4, 120, 87); }
                .heatmap-month-labels { display: flex; justify-content: space-between; margin-top: 0.75rem; font-size: 0.75rem; color: var(--text-mid); font-weight: 500; }

                /* Table */
                .question-list-container { margin-top: 2rem; }
                .details-table-wrapper { background-color: var(--card-bg); border-radius: 0.5rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.06); overflow: hidden; border: 1px solid var(--border-light); transition: background-color 300ms, border-color 300ms; }
                .details-table { min-width: 100%; border-collapse: collapse; }
                .details-table-header { background-color: var(--table-header-bg); text-align: left; transition: background-color 300ms; }
                .table-header-cell { padding: 0.75rem 1.5rem; font-size: 0.75rem; font-weight: 600; color: var(--text-mid); text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid var(--border-light); }
                .table-row:hover { background-color: rgba(56, 189, 248, 0.05); }
                .dark-mode .table-row:hover { background-color: rgb(42, 52, 66); }
                .table-data-question { padding: 1rem 1.5rem; font-size: 0.875rem; color: var(--text-dark); }
                .table-data-topic, .table-data-result { padding: 1rem 1.5rem; white-space: nowrap; font-size: 0.875rem; font-weight: 500; color: var(--text-mid); }
                .result-badge { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 9999px; font-weight: 700; font-size: 0.75rem; text-transform: uppercase; }
                .result-badge.correct { background-color: rgba(16, 185, 129, 0.15); color: var(--success-color); }
                .result-badge.incorrect { background-color: rgba(239, 68, 68, 0.15); color: var(--danger-color); }
            `}</style>

            <header className="app-header">
                <div className="header-left">
                    <h1 className="app-title">Candidate Performance Dashboard</h1>
                    <p className="user-info">
                        <span>User:</span>
                        <span id="user-id-display">Sample User</span>
                        <Edit3 className="user-edit-icon" />
                    </p>
                </div>
                <button onClick={toggleTheme} className="theme-toggle-button" aria-label={`Switch to ${isDarkMode ? 'Light' : 'Dark'} Mode`}>
                    {isDarkMode ? <Sun className="theme-toggle-icon" /> : <Moon className="theme-toggle-icon" />}
                </button>
            </header>

            <div className="main-layout">
                <div className="sidebar-container">
                    <div className="card" style={{ marginBottom: "1.5rem" }}>
                        <h2 className="section-title">Domains ({domainKeys.length})</h2>
                        <ul className="domain-list">
                            {domainKeys.map(key => {
                                const domain = performanceData.domains[key];
                                const Icon = IconMap[domain.icon] || Code;
                                const isActive = key === currentDomainKey;
                                return (
                                    <li
                                        key={key}
                                        onClick={() => handleDomainSelection(key)}
                                        className={`domain-item ${isActive ? 'domain-item-active' : ''}`}
                                    >
                                        <div className="domain-item-content">
                                            <Icon className={`icon-medium ${isActive ? 'domain-icon-active' : 'domain-icon-inactive'}`} />
                                            <span>{domain.name}</span>
                                        </div>
                                        <div className="score-badge">{domain.avgScore}%</div>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                    <div className="card">
                        <h2 className="section-title">Overall Metrics</h2>
                        <StatCard icon={Gauge} value={overallTests} label="Total Tests" color={SUCCESS_COLOR} />
                    </div>
                </div>

                <div className="main-content">
                    <h2 className="analysis-header">
                        <ChevronRight className="analysis-header-icon" />
                        {currentDomainData?.name || 'No Domain Selected'} Analysis
                    </h2>
                    <div className="metric-grid">
                        <StatCard icon={Edit3} value={currentDomainData?.testsWritten || 0} label="Tests Written" />
                        <StatCard icon={TrendingUp} value={`${currentDomainData?.avgScore || 0}%`} label="Average Score" />
                        <StatCard icon={Gauge} value={`${currentDomainData?.highScore || 0}%`} label="Highest Score" color={WARNING_COLOR} />
                        <StatCard icon={Clock} value={`${currentDomainData?.timeSpentHours || 0}h`} label="Time Spent" />
                    </div>
                    <div className="chart-row">
                        <div className="chart-container">
                            {currentDomainData && <ScoreTrendChart scoreHistory={currentDomainData.scoreHistory} />}
                        </div>
                        <div className="chart-container">
                            {currentDomainData && <MasteryPieChart masteryBreakdown={currentDomainData.masteryBreakdown} />}
                        </div>
                    </div>
                    {currentDomainData && <ActivityHeatmap activityData={currentDomainData.activityHeatmap} />}
                    {currentDomainData && <AttemptedQuestionsList previousTests={currentDomainData.previousTests} />}
                </div>
            </div>
        </div>
    );
}