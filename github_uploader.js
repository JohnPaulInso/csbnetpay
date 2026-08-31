/**
 * CSB NetPay - In-Browser GitHub Direct Live Uploader
 * Allows direct browser-to-GitHub commits without local Git or USB transfers.
 */
(function() {
    const REPO_OWNER = 'JohnPaulInso';
    const REPO_NAME = 'csbnetpay';
    const REPO_BRANCH = 'main';

    function getStoredToken() {
        return localStorage.getItem('csb_gh_token') || sessionStorage.getItem('csb_gh_token') || '';
    }

    function setStoredToken(token) {
        if (token) {
            localStorage.setItem('csb_gh_token', token.trim());
        } else {
            localStorage.removeItem('csb_gh_token');
        }
    }

    async function promptTokenIfNeeded() {
        let token = getStoredToken();
        if (token) return token;

        token = prompt("Please enter your GitHub Personal Access Token (with 'repo' or 'contents:write' permission) to enable live uploads directly to GitHub:");
        if (token && token.trim()) {
            setStoredToken(token.trim());
            return token.trim();
        }
        return null;
    }

    /**
     * Upload one or multiple files directly to GitHub repo in a single atomic commit
     * @param {Array<{path: string, content: string}>} filesList - Array of {path, content}
     * @param {string} commitMessage - Commit message
     * @param {function} onProgress - Progress callback ({step, percent, message})
     */
    async function uploadFilesToGithub(filesList, commitMessage, onProgress) {
        const token = await promptTokenIfNeeded();
        if (!token) {
            throw new Error("GitHub upload token is required to publish directly to GitHub.");
        }

        const report = (step, percent, message) => {
            if (typeof onProgress === 'function') {
                onProgress({ step, percent, message });
            }
        };

        const headers = {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github+json',
            'Content-Type': 'application/json'
        };

        report(1, 10, "Fetching repository manifest & latest commit...");

        // 1. Fetch available_files.json from repo to update manifest
        let manifestFiles = [];
        try {
            const manifestRes = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/available_files.json?ref=${REPO_BRANCH}&_=${Date.now()}`, { headers });
            if (manifestRes.ok) {
                const manifestData = await manifestRes.json();
                const rawContent = decodeURIComponent(escape(atob(manifestData.content.replace(/\n/g, ''))));
                manifestFiles = JSON.parse(rawContent);
            }
        } catch (e) {
            console.warn("Could not fetch remote available_files.json, building locally:", e);
        }

        // Add newly uploaded CSV filenames to manifest if not already included
        filesList.forEach(f => {
            if (f.path.endsWith('.csv') && !manifestFiles.includes(f.path)) {
                manifestFiles.push(f.path);
            }
        });
        manifestFiles.sort();

        // Include updated available_files.json in upload batch
        const allFilesToUpload = [
            ...filesList,
            {
                path: 'available_files.json',
                content: JSON.stringify(manifestFiles, null, 2)
            }
        ];

        report(2, 25, "Getting latest Git branch reference...");
        // 2. Get reference to HEAD of main branch
        const refRes = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/git/ref/heads/${REPO_BRANCH}`, { headers });
        if (!refRes.ok) {
            const err = await refRes.json();
            throw new Error(`Failed to get branch reference: ${err.message || refRes.statusText}`);
        }
        const refData = await refRes.json();
        const latestCommitSha = refData.object.sha;

        // 3. Get base tree SHA from latest commit
        const commitRes = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/git/commits/${latestCommitSha}`, { headers });
        if (!commitRes.ok) {
            throw new Error("Failed to fetch latest commit details.");
        }
        const commitData = await commitRes.json();
        const baseTreeSha = commitData.tree.sha;

        // 4. Create blobs for each file
        const treeItems = [];
        const total = allFilesToUpload.length;
        for (let i = 0; i < total; i++) {
            const fileObj = allFilesToUpload[i];
            const pct = Math.floor(30 + (40 * (i + 1) / total));
            report(3, pct, `Uploading file [${i + 1}/${total}]: ${fileObj.path}...`);

            // UTF-8 base64 encoding
            const base64Content = btoa(unescape(encodeURIComponent(fileObj.content)));
            const blobRes = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/git/blobs`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    content: base64Content,
                    encoding: 'base64'
                })
            });

            if (!blobRes.ok) {
                const err = await blobRes.json();
                throw new Error(`Failed to upload blob for ${fileObj.path}: ${err.message || blobRes.statusText}`);
            }
            const blobData = await blobRes.json();
            treeItems.push({
                path: fileObj.path,
                mode: '100644',
                type: 'blob',
                sha: blobData.sha
            });
        }

        // 5. Create new Git tree
        report(4, 75, "Creating Git tree structure...");
        const treeRes = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/git/trees`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                base_tree: baseTreeSha,
                tree: treeItems
            })
        });

        if (!treeRes.ok) {
            const err = await treeRes.json();
            throw new Error(`Failed to create Git tree: ${err.message}`);
        }
        const treeData = await treeRes.json();

        // 6. Create Git commit
        report(5, 88, "Creating live commit on GitHub...");
        const newCommitRes = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/git/commits`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                message: commitMessage || `Update: Upload abstract & LCS files live`,
                tree: treeData.sha,
                parents: [latestCommitSha]
            })
        });

        if (!newCommitRes.ok) {
            const err = await newCommitRes.json();
            throw new Error(`Failed to create Git commit: ${err.message}`);
        }
        const newCommitData = await newCommitRes.json();

        // 7. Update branch reference to point to new commit
        report(6, 95, "Updating main branch...");
        const updateRefRes = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/git/refs/heads/${REPO_BRANCH}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({
                sha: newCommitData.sha,
                force: false
            })
        });

        if (!updateRefRes.ok) {
            const err = await updateRefRes.json();
            throw new Error(`Failed to update main branch: ${err.message}`);
        }

        report(7, 100, "Live update published successfully to GitHub!");
        return { success: true, commitSha: newCommitData.sha, files: allFilesToUpload.map(f => f.path) };
    }

    // Export globally
    window.CSB_GITHUB = {
        uploadFiles: uploadFilesToGithub,
        getToken: getStoredToken,
        setToken: setStoredToken
    };
})();
