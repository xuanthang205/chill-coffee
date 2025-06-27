import { db } from "./firebase-config.js";
            import { collection, getDocs, updateDoc, doc } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

            const tableBody = document.querySelector("#users-table tbody");
            const searchInput = document.getElementById("user-search");
            const roleFilter = document.getElementById("role-filter");
            const statusFilter = document.getElementById("status-filter");

            let allUsers = [];

            async function loadUsers() {
                const usersSnapshot = await getDocs(collection(db, "users"));
                allUsers = [];

                usersSnapshot.forEach((docSnap) => {
                    const data = docSnap.data();
                    if (data.role_id !== 1) {
                        allUsers.push({ id: docSnap.id, ...data });
                    }
                });

                renderUsers(allUsers);
            }

            function renderUsers(users) {
                const searchValue = searchInput.value.toLowerCase().trim();
                const roleVal = roleFilter.value;
                const statusVal = statusFilter.value;

                const filteredUsers = users.filter((user) => {
                    const matchName = user.username?.toLowerCase().includes(searchValue);
                    const matchRole = !roleVal || user.role_id == roleVal;
                    const matchStatus = !statusVal || (statusVal === "active" && user.is_disabled !== true) || (statusVal === "disabled" && user.is_disabled === true);
                    return matchName && matchRole && matchStatus;
                });

                tableBody.innerHTML = "";

                if (filteredUsers.length === 0) {
                    tableBody.innerHTML = `<tr><td colspan="5" class="text-center">Không tìm thấy người dùng phù hợp.</td></tr>`;
                    return;
                }

                filteredUsers.forEach((user) => {
                    const tr = document.createElement("tr");

                    const roleSelect = document.createElement("select");
                    roleSelect.innerHTML = `
        <option value="2" ${user.role_id === 2 ? "selected" : ""}>Nhân viên</option>
        <option value="3" ${user.role_id === 3 ? "selected" : ""}>Khách hàng</option>
      `;
                    roleSelect.addEventListener("change", async () => {
                        await updateDoc(doc(db, "users", user.id), {
                            role_id: parseInt(roleSelect.value),
                        });
                        alert("Cập nhật quyền thành công");
                    });

                    const isDisabled = user.is_disabled === true;
                    const statusText = isDisabled ? "Đã khóa" : "Đang hoạt động";

                    const statusBtn = document.createElement("button");
                    statusBtn.textContent = isDisabled ? "Mở khóa" : "Khóa";
                    statusBtn.style.backgroundColor = isDisabled ? "green" : "red";
                    statusBtn.style.color = "#fff";

                    statusBtn.addEventListener("click", async () => {
                        const newStatus = !isDisabled;
                        await updateDoc(doc(db, "users", user.id), {
                            is_disabled: newStatus,
                        });
                        alert(newStatus ? "Đã khóa tài khoản" : "Đã mở khóa tài khoản");
                        loadUsers(); // reload lại danh sách
                    });

                    tr.innerHTML = `
        <td>${user.email}</td>
        <td>${user.username}</td>
        <td></td>
        <td>${statusText}</td>
        <td></td>
      `;

                    tr.children[2].appendChild(roleSelect);
                    tr.children[4].appendChild(statusBtn);
                    tableBody.appendChild(tr);
                });
            }

            // Gắn sự kiện lọc
            searchInput.addEventListener("input", () => renderUsers(allUsers));
            roleFilter.addEventListener("change", () => renderUsers(allUsers));
            statusFilter.addEventListener("change", () => renderUsers(allUsers));

            loadUsers();