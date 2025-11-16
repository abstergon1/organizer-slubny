// js/users.js

function renderUsers() {
    const userList = document.getElementById('userList'); if (!userList) return;
    userList.innerHTML = '';
    users.forEach(user => {
        const li = document.createElement('li'); li.style.display = 'flex'; li.style.justifyContent = 'space-between'; li.style.alignItems = 'center'; li.style.padding = '10px'; li.style.borderBottom = '1px solid #eee';
        let permissionText = 'Podgląd'; if (user.permission_level === 'editor') permissionText = 'Edycja'; if (user.permission_level === 'owner') permissionText = 'Właściciel';
        let actionsHtml = '';
        if (user.permission_level !== 'owner') {
            actionsHtml = `<div style="display: flex; gap: 5px;"><button type="button" class="secondary" style="padding: 5px 10px;" onclick="updateUserPermission(${user.id}, '${user.permission_level}')">Zmień</button><button type="button" class="secondary" style="background: #e53935; padding: 5px 10px;" onclick="removeUserAccess(${user.id}, '${user.email}')">Usuń</button></div>`;
        }
        li.innerHTML = `<span><strong>${user.email}</strong> - <span style="font-style: italic;">${permissionText}</span></span>${actionsHtml}`;
        userList.appendChild(li);
    });
}

function updateUserPermission(userId, currentLevel) {
    const newLevel = prompt(`Wybierz nowy poziom uprawnień (wpisz 'editor' lub 'viewer'):`, currentLevel);
    if (newLevel && (newLevel === 'editor' || newLevel === 'viewer')) {
        const formData = new FormData(); formData.append('action', 'update_user_permission'); formData.append('user_id', userId); formData.append('permission_level', newLevel);
        fetch('index.php', { method: 'POST', body: formData }).then(res => res.json()).then(result => { if (result.success) renderAll(); else alert(result.message || "Wystąpił błąd."); });
    } else if (newLevel !== null) { alert("Wprowadzono nieprawidłową wartość. Dozwolone: 'editor' lub 'viewer'."); }
}

function removeUserAccess(userId, userEmail) {
    if (confirm(`Czy na pewno chcesz usunąć dostęp dla użytkownika ${userEmail}?`)) {
        const formData = new FormData(); formData.append('action', 'remove_user_access'); formData.append('user_id', userId);
        fetch('index.php', { method: 'POST', body: formData }).then(res => res.json()).then(result => { if (result.success) renderAll(); else alert(result.message || "Wystąpił błąd."); });
    }
}