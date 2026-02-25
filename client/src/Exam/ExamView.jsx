import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import DsaExam from './DsaExam';
import SqlExam from './SqlExam';
import ReactExam from './ReactExam';
import './ExamView.css';

export default function ExamView() {
    const { problemId } = useParams();
    const [problem, setProblem] = useState(null);
    const [allProblemIds, setAllProblemIds] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProblem = async () => {
            setLoading(true);
            try {
                const { data } = await axios.get(`http://localhost:5000/api/problems/${problemId}`);
                setProblem(data.problemData);
                setAllProblemIds(data.allProblemIds);
            } catch (error) {
                setProblem({ title: "Error", description: "Could not load problem." });
            } finally {
                setLoading(false);
            }
        };
        fetchProblem();
    }, [problemId]);

    if (loading || !problem) {
        return <div className="loading-container">Loading...</div>;
    }

    const renderExamComponent = () => {
        const commonProps = { problem, allProblemIds };
        switch (problem.category) {
            case 'dsa':
                return <DsaExam {...commonProps} />;
            case 'sql':
                return <SqlExam {...commonProps} />;
            case 'react':
                return <ReactExam {...commonProps} />;
            default:
                return <div>Unsupported exam category: {problem.category || "Not specified"}</div>;
        }
    };

    return <div className="exam-container">{renderExamComponent()}</div>;
}