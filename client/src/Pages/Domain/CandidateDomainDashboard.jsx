import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// This component fetches and displays the domains for the logged-in candidate.
const CandidateDomainsList = () => {
    // State to hold the array of the candidate's domains
    const navigate = useNavigate();

    const handleClick = async (domainId)=>{
        const response = await fetch(`/api/domains/${domainId}`, {credentials : 'include'});

        if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch data");
        }
        const result = await response.json(); 
        navigate(`/domain/${domainId}`);
    }
    const [domains, setDomains] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchCandidateDomains = async () => {
            try {
                setLoading(true);
                // This endpoint should be protected and fetch data for the logged-in user
                const response = await fetch('/api/domains/domains');
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || "Failed to fetch your domains");
                }
                
                const result = await response.json();
                
                // The API response has a `data` property containing the array
                setDomains(result.data); 
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchCandidateDomains();
    }, []); // Empty dependency array ensures this runs only once on component mount

    if (loading) {
        return <div className="loadingState">Loading your domains...</div>;
    }

    if (error) {
        return <div className="errorState">Error: {error}</div>;
    }

    if (!domains || domains.length === 0) {
        return <div className="loadingState">You have not selected any domains yet.</div>;
    }

    return (
        <div className="overviewContainer">
            <style>{css}</style>
            <main className="mainContent">
                <div className="header">
                    <h1>My Domains</h1>
                    <p className="description">Here is an overview of your performance in each selected domain.</p>
                </div>
                
                <div className="listGrid">
                    {domains.map(domain => (
                        // ✅ FIX: Added the unique key prop to the top-level element in the map
                        <div key={domain.domain_id} className="domainCard">
                            <h3 className="cardTitle">{domain.domain_name}</h3>
                            <p className="domainDescription">{domain.description || 'No description available.'}</p>
                            
                            <div className="statsContainer">
                                <div className="statItem">
                                    <span className="statLabel">Tier</span>
                                    <span className="statValue tier">{domain.tier_name}</span>
                                </div>
                                <div className="statItem">
                                    <span className="statLabel">Rank</span>
                                    <span className="statValue">#{domain.current_rank}</span>
                                </div>
                                <div className="statItem">
                                    <span className="statLabel">Total Score</span>
                                    <span className="statValue">{domain.rating}</span>
                                </div>
                            </div>

                            <div className="cardFooter">
                                <span className={`statusBadge ${domain.status?.toLowerCase()}`}>{domain.status}</span>
                                <button onClick={() => handleClick(domain.domain_id)} className="detailsLink">View Dashboard</button>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default CandidateDomainsList;


// --- Embedded CSS ---
const css = `
.overviewContainer {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background-color: #f0f2f5;
    min-height: 100vh;
    width: 100%;
    display: flex;
    justify-content: center;
    padding: 2rem;
}

.mainContent {
    width: 100%;
    max-width: 1200px;
}

.header {
    margin-bottom: 2.5rem;
    padding-bottom: 1.5rem;
    border-bottom: 1px solid #e0e0e0;
}

.header h1 {
    font-size: 2.5rem;
    font-weight: 700;
    color: #1a1a1a;
    margin-bottom: 0.5rem;
}

.description {
    font-size: 1.1rem;
    color: #5f6368;
    max-width: 800px;
}

.listGrid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 2rem;
}

.domainCard {
    background-color: #ffffff;
    border-radius: 12px;
    padding: 1.5rem 2rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.07);
    border-left: 5px solid #3b82f6;
    display: flex;
    flex-direction: column;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.domainCard:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}

.cardTitle {
    font-size: 1.2rem;
    font-weight: 600;
    color: #333;
    margin: 0 0 0.75rem 0;
}

.domainDescription {
    color: #5f6368;
    line-height: 1.6;
    margin-bottom: 1.5rem;
    flex-grow: 1;
}

.statsContainer {
    display: flex;
    justify-content: space-around;
    padding: 1rem 0;
    border-top: 1px solid #f0f0f0;
    border-bottom: 1px solid #f0f0f0;
    margin-bottom: 1.5rem;
}

.statItem {
    text-align: center;
}

.statLabel {
    display: block;
    font-size: 0.8rem;
    color: #777;
    margin-bottom: 0.25rem;
    text-transform: uppercase;
}

.statValue {
    font-size: 1.25rem;
    font-weight: 600;
    color: #333;
}

.statValue.tier {
    color: #3b82f6;
}

.cardFooter {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: auto;
}

.detailsLink {
    background-color: #e8f0fe;
    color: #3b82f6;
    padding: 0.5rem 1rem;
    border-radius: 20px;
    text-decoration: none;
    font-weight: 500;
    transition: background-color 0.2s ease;
}

.detailsLink:hover {
    background-color: #dbeafe;
}

.statusBadge {
    padding: 0.3rem 0.8rem;
    border-radius: 15px;
    font-size: 0.8rem;
    font-weight: 500;
    color: #fff;
}

.statusBadge.active {
    background-color: #22c55e;
}

.loadingState, .errorState {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 80vh;
    font-size: 1.2rem;
    color: #5f6368;
}

.errorState {
    color: #ef4444;
}
`;