// src/js/admin_orders.js
import { auth, db } from "./firebase-config.js";
import { collection, getDocs, updateDoc, doc, where, query, orderBy } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import { checkSession } from "./check-session.js";

// Lấy userSession từ localStorage
let userSession = JSON.parse(localStorage.getItem("user_session"));

// Kiểm tra phiên đăng nhập ngay lập tức
if (!checkSession()) {
    console.log("Phiên đăng nhập không hợp lệ, chuyển hướng...");
}

// Kiểm tra quyền khi DOM loaded
document.addEventListener("DOMContentLoaded", async () => {
    try {
        if (!userSession || !userSession.user || !userSession.user.email) {
            alert("Phiên đăng nhập không hợp lệ! Vui lòng đăng nhập lại.");
            window.location.href = "./index.html";
            return;
        }

        const email = userSession.user.email;
        console.log("Email dùng trong truy vấn:", email);
        if (typeof email !== "string" || email.trim() === "") {
            throw new Error("Email không hợp lệ: " + JSON.stringify(email));
        }

        const q = query(collection(db, "users"), where("email", "==", email));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            alert("Không tìm thấy người dùng!");
            window.location.href = "./index.html";
            return;
        }

        let hasPermission = false;
        querySnapshot.forEach((doc) => {
            const user = doc.data();
            if (user.role_id === 1 || user.role_id === 2) {
                hasPermission = true;
            }
        });

        if (!hasPermission) {
            alert("Bạn không có quyền truy cập!");
            window.location.href = "./index.html";
            return;
        }

        await loadOrders();
    } catch (error) {
        console.error("Lỗi khi kiểm tra quyền truy cập:", error);
        alert("Có lỗi xảy ra khi kiểm tra quyền truy cập!");
        window.location.href = "./index.html";
    }
});

// loadOrders với tên khách, tìm kiếm và lọc bàn
async function loadOrders() {
    try {
        const orderTableBody = document.getElementById("order-list-admin");
        const searchInput = document.getElementById("order-search");
        const tableFilter = document.getElementById("table-filter");
        const statusFilter = document.getElementById("status-filter");

        const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        let allOrders = [];
        const emailSet = new Set();

        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            allOrders.push({ id: docSnap.id, ...data });
            if (data.author) emailSet.add(data.author);
        });

        // Lấy tên người dùng từ email
        const emailToUsername = {};
        for (const email of emailSet) {
            const userQuery = query(collection(db, "users"), where("email", "==", email));
            const userSnapshot = await getDocs(userQuery);
            if (!userSnapshot.empty) {
                const userData = userSnapshot.docs[0].data();
                emailToUsername[email] = userData.username || email;
            } else {
                emailToUsername[email] = "Khách vãng lai";
            }
        }

        const renderOrders = (orders) => {
            if (orders.length === 0) {
                orderTableBody.innerHTML = '<tr><td colspan="7" class="text-center">Không tìm thấy đơn hàng nào.</td></tr>';
                return;
            }

            let htmls = "";
            orders.forEach((orderItem) => {
                const totalPrice = (orderItem.product.price * parseInt(orderItem.quantity)).toLocaleString("vi-VN");
                const username = emailToUsername[orderItem.author] || "Khách vãng lai";
                const createdAt = orderItem.createdAt.toDate().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });

                htmls += `
          <tr class="product-item text-center">
            <td>${createdAt}</td>
            <td>${username}</td>
            <td>${orderItem.tableNumber || "--"}</td>
            <td>${orderItem.product.name}</td>
            <td>${orderItem.quantity}</td>
            <td>${totalPrice} VND</td>
            <td>
              <select class="slt-order-status" data-order-id="${orderItem.id}">
                <option value="0" ${orderItem.status === 0 ? "selected" : ""}>Chờ xác nhận</option>
                <option value="1" ${orderItem.status === 1 ? "selected" : ""}>Đang pha chế</option>
                <option value="2" ${orderItem.status === 2 ? "selected" : ""}>Hoàn thành</option>
                <option value="3" ${orderItem.status === 3 ? "selected" : ""}>Đã hủy</option>
              </select>
            </td>
          </tr>
        `;
            });

            orderTableBody.innerHTML = htmls;

            document.querySelectorAll(".slt-order-status").forEach((selectElement) => {
                selectElement.addEventListener("change", async () => {
                    const orderId = selectElement.getAttribute("data-order-id");
                    const newStatus = parseInt(selectElement.value);
                    try {
                        await updateDoc(doc(db, "orders", orderId), { status: newStatus });
                        alert("Cập nhật trạng thái thành công");
                    } catch (error) {
                        console.error("Lỗi khi cập nhật trạng thái:", error);
                        alert("Có lỗi xảy ra khi cập nhật trạng thái!");
                    }
                });
            });
        };

        const filterAndRender = () => {
            const keyword = searchInput.value.trim().toLowerCase();
            const selectedTable = tableFilter.value;
            const selectedStatus = statusFilter.value; // ⬅️ lọc theo trạng thái

            const filtered = allOrders.filter((order) => {
                const username = emailToUsername[order.author] || "Khách vãng lai";

                const matchKeyword = username.toLowerCase().includes(keyword) || order.tableNumber?.toString().includes(keyword) || order.product?.name?.toLowerCase().includes(keyword);

                const matchTable = selectedTable === "" || order.tableNumber?.toString() === selectedTable;

                const matchStatus = selectedStatus === "" || order.status?.toString() === selectedStatus;

                return matchKeyword && matchTable && matchStatus;
            });

            renderOrders(filtered);
        };

        searchInput.addEventListener("input", filterAndRender);
        tableFilter.addEventListener("change", filterAndRender);
        statusFilter.addEventListener("change", filterAndRender);

        const clearInputBtn = document.getElementById("clearInput");
        clearInputBtn.addEventListener("click", () => {
            searchInput.value = "";
            filterAndRender();
        });

        renderOrders(allOrders);
    } catch (error) {
        console.error("Lỗi khi tải danh sách đơn hàng:", error);
        const orderTableBody = document.getElementById("order-list-admin");
        orderTableBody.innerHTML = '<tr><td colspan="7" class="text-center">Lỗi tải dữ liệu đơn hàng.</td></tr>';
    }
}

// Gọi hàm tải đơn hàng ngay lập tức
loadOrders();
