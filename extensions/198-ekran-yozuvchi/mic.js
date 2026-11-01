$('#ask').onclick = async () => {
  try { const s = await navigator.mediaDevices.getUserMedia({ audio: true }); s.getTracks().forEach(t => t.stop()); $('#st').textContent = 'Ruxsat berildi. Bu tabni yopishingiz mumkin.'; setTimeout(() => window.close(), 1500); }
  catch { $('#st').textContent = 'Ruxsat berilmadi. Manzil satridagi qulf belgisi orqali mikrofonga ruxsat bering.'; }
};
