// src/js/wallet.js
import { auth, db } from './firebase-config.js';
import { collection, query, where, getDocs, updateDoc, doc, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js';
import { checkSession } from './check-session.js';

// Lấy userSession từ localStorage
let userSession = JSON.parse(localStorage.getItem('user_session'));

// Kiểm tra phiên đăng nhập ngay lập tức
if (!checkSession()) {
  console.log("Phiên đăng nhập không hợp lệ, chuyển hướng...");
}

// Xử lý khi DOM loaded
document.addEventListener('DOMContentLoaded', () => {
  // Tải dữ liệu ví
  loadBalance();
  loadTransactionHistory();
});

// Format số tiền
function formatBalance(balance) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(balance);
}

// Tải số dư từ Firestore
async function loadBalance() {
  try {
    if (!userSession || !userSession.user || !userSession.user.email) {
      document.querySelector('.balance-number').textContent = "Vui lòng đăng nhập";
      return;
    }

    const authorEmail = userSession.user.email;
    const q = query(collection(db, "users"), where("email", "==", authorEmail));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      document.querySelector('.balance-number').textContent = "Không tìm thấy thông tin người dùng";
      return;
    }

    querySnapshot.forEach((doc) => {
      const balance = doc.data().balance || 0;
      document.querySelector('.balance-number').textContent = formatBalance(balance);
      document.getElementById('last-updated').textContent = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
    });
  } catch (error) {
    console.error("Lỗi khi tải số dư:", error);
    document.querySelector('.balance-number').textContent = "Lỗi tải số dư";
  }
}

// Tải lịch sử giao dịch
async function loadTransactionHistory() {
  try {
    const authorEmail = userSession.user.email;
    const q = query(collection(db, "transactions"), where("userEmail", "==", authorEmail));
    const querySnapshot = await getDocs(q);
    const transactionList = document.querySelector('.transaction-list');

    if (querySnapshot.empty) {
      transactionList.innerHTML = '<p class="text-muted text-center">Chưa có giao dịch nào.</p>';
      return;
    }

    let htmls = '';
    querySnapshot.forEach((doc) => {
      const transaction = doc.data();
      const date = transaction.timestamp.toDate().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
      const amount = formatBalance(transaction.amount);
      htmls += `
        <div class="transaction-item d-flex justify-content-between">
          <span>${transaction.type === 'deposit' ? 'Nạp tiền' : 'Thanh toán'} - ${transaction.bank || 'Ví'}</span>
          <span class="amount text-${transaction.type === 'deposit' ? 'success' : 'danger'}">${amount}</span>
          <span>${date}</span>
        </div>
      `;
    });
    transactionList.innerHTML = htmls;
  } catch (error) {
    console.error("Lỗi khi tải lịch sử giao dịch:", error);
    document.querySelector('.transaction-list').innerHTML = '<p class="text-danger text-center">Lỗi tải lịch sử giao dịch.</p>';
  }
}

// Xử lý nạp tiền
const balanceForm = document.querySelector('#balance-form');
if (balanceForm) {
  balanceForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const cardNumber = document.querySelector('#card-number').value;
    const bankSelect = document.querySelector('#bank-select').value;
    const amount = parseFloat(document.querySelector('#amount').value);

    if (!cardNumber || !bankSelect || isNaN(amount) || amount < 10000) {
      alert("Vui lòng nhập đầy đủ và đúng thông tin (số tiền tối thiểu 10,000 VND)!");
      return;
    }

    try {
      const authorEmail = userSession.user.email;
      const userQuery = query(collection(db, "users"), where("email", "==", authorEmail));
      const userSnapshot = await getDocs(userQuery);

      if (userSnapshot.empty) {
        alert("Không tìm thấy thông tin người dùng!");
        return;
      }

      const userDoc = userSnapshot.docs[0];
      const currentBalance = userDoc.data().balance || 0;
      const newBalance = currentBalance + amount;

      // Cập nhật số dư
      await updateDoc(doc(db, "users", userDoc.id), { balance: newBalance });

      // Thêm giao dịch vào lịch sử
      await addDoc(collection(db, "transactions"), {
        userEmail: authorEmail,
        type: 'deposit',
        amount: amount,
        bank: bankSelect,
        timestamp: serverTimestamp()
      });

      alert("Nạp tiền thành công!");
      document.querySelector('.balance-number').textContent = formatBalance(newBalance);
      balanceForm.reset(); // Reset form
      loadTransactionHistory(); // Cập nhật lịch sử
    } catch (error) {
      console.error("Lỗi khi nạp tiền:", error);
      alert("Có lỗi xảy ra khi nạp tiền!");
    }
  });
}