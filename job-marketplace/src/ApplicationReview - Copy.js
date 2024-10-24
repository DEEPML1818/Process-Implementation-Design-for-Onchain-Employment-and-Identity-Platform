import { useState, useEffect } from "react";
import { create } from "ipfs-http-client";

const ipfs = create("https://ipfs.infura.io:5001/api/v0");

function ApplicationReview({ jobContractAddress }) {
    const [applications, setApplications] = useState([]);

    useEffect(() => {
        // Fetch applications from IPFS (Placeholder for actual fetching)
        async function fetchApplications() {
            const applicationHashes = []; // Replace with actual data
            const fetchedApplications = [];

            for (const hash of applicationHashes) {
                const appData = await ipfs.cat(hash);
                fetchedApplications.push(JSON.parse(appData));
            }

            setApplications(fetchedApplications);
        }

        fetchApplications();
    }, [jobContractAddress]);

    return (
        <div>
            <h2>Job Applications</h2>
            <ul>
                {applications.map((app, index) => (
                    <li key={index}>
                        <p>Portfolio: {app.portfolio}</p>
                        {/* Additional application details */}
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default ApplicationReview;
