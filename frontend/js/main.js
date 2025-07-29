document.addEventListener('DOMContentLoaded', () => {
    const page = window.location.pathname.split('/').pop();

    if (page === 'login.html' || page === '') {
        handleLoginPage();
    } else if (page === 'index.html') {
        handleVotingPage();
    } else if (page === 'results.html') {
        handleResultsPage();
    } else if (page === 'winners.html') {
        handleWinnersPage();
    } else if (page === 'admin.html') {
        handleAdminPage();
    }
});

function handleLoginPage() {
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', async () => {
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const messageEl = document.getElementById('loginMessage');

            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                sessionStorage.setItem('user', JSON.stringify(data.user));
                if (data.user.role === 'admin') {
                    window.location.href = 'admin.html';
                } else {
                    window.location.href = 'index.html';
                }
            } else {
                messageEl.textContent = data.error;
            }
        });
    }
}

async function handleVotingPage() {
    const user = JSON.parse(sessionStorage.getItem('user'));
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    document.getElementById('username-display').textContent = user.username;
    const candidatesList = document.getElementById('candidates-list');
    const voteBtn = document.getElementById('voteBtn');
    const voteMessage = document.getElementById('voteMessage');

    const response = await fetch('/api/candidates');
    const candidates = await response.json();

    candidatesList.innerHTML = candidates.map(c => `
        <div class="candidate-card">
            <input type="radio" name="candidate" value="${c.id}">
            <img src="${c.image_url}" alt="${c.name}">
            <div>
                <h4>${c.name}</h4>
                <p><strong>Position:</strong> ${c.position}</p>
                <p>${c.bio}</p>
            </div>
        </div>
    `).join('');

    voteBtn.addEventListener('click', async () => {
        const selectedCandidate = document.querySelector('input[name="candidate"]:checked');
        if (!selectedCandidate) {
            voteMessage.textContent = 'Please select a candidate.';
            return;
        }

        const candidateId = selectedCandidate.value;
        const voteResponse = await fetch('/api/vote', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id, candidateId })
        });

        const voteData = await voteResponse.json();
        if (voteResponse.ok) {
            voteMessage.textContent = 'Vote cast successfully!';
            voteBtn.disabled = true;
        } else {
            voteMessage.textContent = voteData.error;
        }
    });
}

async function handleResultsPage() {
    const resultsTableBody = document.querySelector('#resultsTable tbody');
    const response = await fetch('/api/results');
    const results = await response.json();

    resultsTableBody.innerHTML = results.map(r => `
        <tr>
            <td>${r.name}</td>
            <td>${r.position}</td>
            <td>${r.vote_count}</td>
        </tr>
    `).join('');
}

async function handleWinnersPage() {
    const winnersList = document.getElementById('winners-list');
    const response = await fetch('/api/results');
    const results = await response.json();

    const winners = results.reduce((acc, curr) => {
        if (!acc[curr.position] || acc[curr.position].vote_count < curr.vote_count) {
            acc[curr.position] = curr;
        }
        return acc;
    }, {});

    winnersList.innerHTML = Object.values(winners).map(w => `
        <div class="winner">
            <h3>${w.position}</h3>
            <p>${w.name} with ${w.vote_count} votes</p>
        </div>
    `).join('');
}

async function handleAdminPage() {
    const user = JSON.parse(sessionStorage.getItem('user'));
    if (!user || user.role !== 'admin') {
        window.location.href = 'login.html';
        return;
    }

    const addUserBtn = document.getElementById('addUserBtn');
    const usersTableBody = document.querySelector('#usersTable tbody');

    async function fetchUsers() {
        const response = await fetch('/api/admin/users');
        const users = await response.json();
        usersTableBody.innerHTML = users.map(u => `
            <tr>
                <td>${u.id}</td>
                <td>${u.username}</td>
                <td>${u.role}</td>
                <td>${u.has_voted ? 'Yes' : 'No'}</td>
                <td><button onclick="removeUser(${u.id})">Remove</button></td>
            </tr>
        `).join('');
    }

    addUserBtn.addEventListener('click', async () => {
        const username = document.getElementById('new-username').value;
        const password = document.getElementById('new-password').value;
        const role = document.getElementById('new-role').value;
        const messageEl = document.getElementById('addUserMessage');

        const response = await fetch('/api/admin/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, role })
        });

        const data = await response.json();
        if (response.ok) {
            messageEl.textContent = 'User added successfully!';
            fetchUsers();
        } else {
            messageEl.textContent = data.error;
        }
    });

    window.removeUser = async (userId) => {
        const response = await fetch(`/api/admin/users/${userId}`, {
            method: 'DELETE'
        });
        const data = await response.json();
        if (response.ok) {
            fetchUsers();
        } else {
            alert(data.error);
        }
    };

    fetchUsers();
}
